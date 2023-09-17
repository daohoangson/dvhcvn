package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/paulmach/orb"
	"github.com/paulmach/osm"
	"github.com/paulmach/osm/osmpbf"
	"io"
	"net/http"
	"os"
	"path"
	"runtime"
)

func main() {
	var reader io.Reader

	osmPbfPath := os.Getenv("OSM_PBF_PATH")
	if len(osmPbfPath) > 0 {
		reader, _ = os.Open(osmPbfPath)
	} else {
		url := "https://download.geofabrik.de/asia/vietnam-latest.osm.pbf"
		fmt.Printf("Downloading %s...\n", url)
		// this will take some time, there are about 40m points, 4m ways and a few thousand relations
		httpResponse, _ := http.Get(url)
		reader = httpResponse.Body
	}
	_ = pbf.Scan(reader)

	writeDir := os.Args[len(os.Args)-1]
	for _, relation := range pbf.relations {
		writeError := writeRelation(writeDir, relation)
		if writeError != nil {
			fmt.Println(fmt.Errorf("relation.id=%d name=%s: %w", relation.ID, getTagValue(relation.Tags, "name"), writeError))
		}
	}
}

func buildRelationCoordinates(relation *osm.Relation) (*orb.MultiPolygon, error) {
	var lines []orb.LineString
	var wayIds []osm.WayID
	for _, member := range relation.Members {
		if member.Type == osm.TypeWay && member.Role == "outer" {
			if way, ok := pbf.ways[osm.WayID(member.Ref)]; ok {
				line := make(orb.LineString, len(way.Nodes))
				for i, wayNode := range way.Nodes {
					if wayNodePoint, ok := pbf.points[wayNode.ID]; ok {
						line[i] = wayNodePoint
					} else {
						return nil, fmt.Errorf("way.id=%d: nodePoints[%d] does not exist", way.ID, wayNode.ID)
					}
				}
				lines = append(lines, line)
				wayIds = append(wayIds, way.ID)
			}
		}
	}
	return (&multiPolygonBuilder{}).loop(lines, wayIds)
}

func getParentsAndSelf(relation *osm.Relation) (result []*osm.Relation) {
	if parentId, ok := pbf.parentIds[int64(relation.ID)]; ok {
		if parent, ok := pbf.relations[parentId]; ok {
			result = append(result, getParentsAndSelf(parent)...)
		}
	}
	return append(result, relation)
}

func getTagValue(tags osm.Tags, key string) string {
	tag := tags.FindTag(key)
	if tag == nil {
		return ""
	}
	return tag.Value
}

func writeRelation(dir string, relation *osm.Relation) error {
	coordinates, buildError := buildRelationCoordinates(relation)
	if buildError != nil {
		return buildError
	}

	bbox := coordinates.Bound()
	output := map[string]interface{}{
		"bbox":        []float64{bbox.Left(), bbox.Bottom(), bbox.Right(), bbox.Top()},
		"coordinates": coordinates,
		"id":          relation.ID,
		"parent":      "",
		"tags":        relation.Tags,
		"type":        coordinates.GeoJSONType(),
	}

	outputPath := dir
	for _, r := range getParentsAndSelf(relation) {
		outputPath = path.Join(outputPath, fmt.Sprintf("%d", r.ID))
		if r.ID != relation.ID {
			output["parent"] = r.ID
		}
	}
	outputPath = fmt.Sprintf("%s.json", outputPath)
	_ = os.MkdirAll(path.Dir(outputPath), 0755)

	outputBytes, _ := json.Marshal(output)
	writeError := os.WriteFile(outputPath, outputBytes, 0644)
	if writeError != nil {
		panic(fmt.Errorf("os.WriteFile(%s): %w", outputPath, writeError)) // probably something serious, quit asap
	}
	return nil
}

var pbf = &pbfScanner{
	points:    make(map[osm.NodeID]orb.Point, 40000000),
	relations: make(map[osm.RelationID]*osm.Relation, 1000),
	ways:      make(map[osm.WayID]*osm.Way, 4000000),

	parentIds: make(map[int64]osm.RelationID),
}

type pbfScanner struct {
	points    map[osm.NodeID]orb.Point
	relations map[osm.RelationID]*osm.Relation
	ways      map[osm.WayID]*osm.Way

	parentIds map[int64]osm.RelationID
	i         int
}

func (s *pbfScanner) Scan(r io.Reader) error {
	scanner := osmpbf.New(context.Background(), r, runtime.NumCPU())

	for scanner.Scan() {
		s.i++
		o := scanner.Object()
		if node, ok := o.(*osm.Node); ok {
			s.points[node.ID] = node.Point()
			s.printDot("len(points)=%d", len(s.points))
		} else if relation, ok := o.(*osm.Relation); ok {
			s.appendRelationIfTypeBoundaryAdministrative(relation)
			s.printDot("len(relations)=%d", len(s.relations))
		} else if way, ok := o.(*osm.Way); ok {
			s.ways[way.ID] = way
			s.printDot("len(ways)=%d", len(s.ways))
		}
	}

	return scanner.Err()
}

func (s *pbfScanner) appendRelationIfTypeBoundaryAdministrative(relation *osm.Relation) {
	if getTagValue(relation.Tags, "type") == "boundary" &&
		getTagValue(relation.Tags, "boundary") == "administrative" {
		for _, member := range relation.Members {
			s.parentIds[member.Ref] = relation.ID
		}
		s.relations[relation.ID] = relation
	}
}

func (s *pbfScanner) printDot(format string, a ...any) {
	if s.i%10000 == 0 {
		fmt.Printf("%d: %s\n", s.i, fmt.Sprintf(format, a...))
	} else if s.i%100 == 0 {
		fmt.Print(".")
	}
}

type multiPolygonBuilder struct {
	lines    int
	position [][2]int // position[lineId] = [ringId, positionInRing]
	rings    int
}

func (b *multiPolygonBuilder) loop(lines []orb.LineString, wayIds []osm.WayID) (*orb.MultiPolygon, error) {
	lineCount := len(lines)
	b.position = make([][2]int, lineCount)
	b.lines = 0

	var output orb.MultiPolygon
	var ring orb.Ring
	b.rings = 0

	for b.lines < lineCount {
		linesBefore := b.lines
		for lineId, line := range lines {
			if b.position[lineId][1] == 0 {
				if ring == nil {
					ring = orb.Ring(line)
					b.rings++
					b.success(lineId)
				} else {
					ringLast := ring[len(ring)-1]
					if line[0].Equal(ringLast) {
						ring = append(ring, line...) // good ordering, just append the ids
						b.success(lineId)
					} else if line[len(line)-1].Equal(ringLast) {
						for j := len(line) - 1; j >= 0; j-- {
							ring = append(ring, line[j]) // out of order, reverse before appending...
						}
						b.success(lineId)
					}
				}
			}
		}

		if b.lines == linesBefore {
			return nil, fmt.Errorf("dead loop detected wayIds=%v position=%v", wayIds, b.position)
		}

		if ring[0].Equal(ring[len(ring)-1]) {
			output = append(output, orb.Polygon{ring}) // ring is closed, that's great!
			ring = nil
		}
	}

	if ring != nil {
		return nil, fmt.Errorf("ring is not closed wayIds=%v position=%v", wayIds, b.position)
	}

	return &output, nil
}

func (b *multiPolygonBuilder) success(lineId int) {
	b.lines++
	b.position[lineId] = [2]int{b.rings, b.lines}
}

package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/paulmach/orb"
	"github.com/paulmach/osm"
	"github.com/paulmach/osm/osmapi"
	"github.com/paulmach/osm/osmpbf"
	"io"
	"math"
	"net/http"
	"os"
	"path"
	"runtime"
	"slices"
	"strconv"
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

func buildRelationCoordinates(relation *osm.Relation, shouldUseApi bool) (*orb.MultiPolygon, error) {
	var lines []orb.LineString
	var wayIds []osm.WayID
	for _, member := range relation.Members {
		if member.Type == osm.TypeWay && member.Role == "outer" {
			wayId := osm.WayID(member.Ref)
			if way, ok := pbf.ways[wayId]; ok {
				line := make(orb.LineString, len(way.Nodes))
				for i, wayNode := range way.Nodes {
					if wayNodePoint, ok := pbf.points[wayNode.ID]; ok {
						line[i] = wayNodePoint
					} else {
						// if the way exists in the data dump, its nodes must be
						panic(fmt.Errorf("relation.id=%d: way.id=%d points[%d] does not exist", relation.ID, way.ID, wayNode.ID))
					}
				}
				lines = append(lines, line)
				wayIds = append(wayIds, way.ID)
			} else {
				if !shouldUseApi {
					return nil, fmt.Errorf("relation.id=%d: ways[%d] does not exist", relation.ID, wayId)
				}

				line, apiError := buildRelationCoordinatesByWayId(relation, wayId)
				if apiError != nil {
					return nil, fmt.Errorf("relation.id=%d: way.id=%d %w", relation.ID, wayId, apiError)
				}
				lines = append(lines, *line)
				wayIds = append(wayIds, wayId)
			}
		}
	}
	return (&multiPolygonBuilder{}).loop(lines, wayIds)
}

func buildRelationCoordinatesByWayId(relation *osm.Relation, wayId osm.WayID) (*orb.LineString, error) {
	ctx := context.Background()
	fmt.Printf("Downloading way#%d for relation#%d...\n", wayId, relation.ID)
	way, wayError := osmapi.Way(ctx, wayId)
	if wayError != nil {
		return nil, fmt.Errorf("osmapi.Way(%d): %w", wayId, wayError)
	}

	nodeIds := make([]osm.NodeID, len(way.Nodes))
	for i, wayNode := range way.Nodes {
		nodeIds[i] = wayNode.ID
	}
	line := make(orb.LineString, len(nodeIds))
	lineError := buildRelationCoordinatesByNodeIds(ctx, line, nodeIds, 0)
	if lineError != nil {
		return nil, lineError
	}
	return &line, nil
}

func buildRelationCoordinatesByNodeIds(ctx context.Context, line orb.LineString, nodeIds []osm.NodeID, offset int) error {
	// maximum URI length is about 2k, node ids are 10 characters in average
	// that means we can fit about 200 ids per request, let's buffer a bit to be safe
	const maxNodeIds = 150
	if len(nodeIds) > maxNodeIds {
		firstError := buildRelationCoordinatesByNodeIds(ctx, line, nodeIds[:maxNodeIds], offset)
		if firstError != nil {
			return firstError
		}
		secondError := buildRelationCoordinatesByNodeIds(ctx, line, nodeIds[maxNodeIds:], offset+maxNodeIds)
		if secondError != nil {
			return secondError
		}
		return nil
	}

	nodes, nodesError := osmapi.Nodes(ctx, nodeIds)
	if nodesError != nil {
		return fmt.Errorf("osmapi.Nodes(%v): %w", nodeIds, nodesError)
	}

	for i, nodeId := range nodeIds {
		// loop twice because the API doesn't return nodes in the requested order
		for _, node := range nodes {
			if node.ID == nodeId {
				line[offset+i] = node.Point()
			}
		}
	}

	return nil
}

func getParentsAndSelf(relationId osm.RelationID) (result []string) {
	if parentId, ok := pbf.parentIds[int64(relationId)]; ok {
		result = append(result, getParentsAndSelf(parentId)...)
	}
	return append(result, strconv.FormatInt(int64(relationId), 10))
}

func getTagValue(tags osm.Tags, key string) string {
	tag := tags.FindTag(key)
	if tag == nil {
		return ""
	}
	return tag.Value
}

func pointsApproxEquals(a orb.Point, b orb.Point) bool {
	// we have two data sources: pbf file and live API
	// because of floating point inconsistency, strict equality may fail unexpectedly
	const epsilon = .00000001
	if math.Abs(a.Lat()-b.Lat()) > epsilon {
		return false
	}
	if math.Abs(a.Lon()-b.Lon()) > epsilon {
		return false
	}
	return true
}

func writeRelation(dir string, relation *osm.Relation) error {
	ids := getParentsAndSelf(relation.ID)
	outputPath := fmt.Sprintf("%s.json", path.Join(dir, path.Join(ids...)))
	_, statError := os.Stat(outputPath)
	if statError == nil {
		// file already exists
		return nil
	}

	vietnamId := "49915"
	isPartOfVietnam := slices.Index(ids, vietnamId) > -1
	isVietnam := ids[len(ids)-1] == vietnamId
	shouldUseApi := isPartOfVietnam && !isVietnam // do not fetch the country's coordinates, it's huge
	coordinates, buildError := buildRelationCoordinates(relation, shouldUseApi)
	if buildError != nil {
		return buildError
	}

	bbox := coordinates.Bound()
	output := map[string]interface{}{
		"bbox":        []float64{bbox.Left(), bbox.Bottom(), bbox.Right(), bbox.Top()},
		"coordinates": coordinates,
		"id":          relation.ID,
		"tags":        relation.Tags,
		"type":        coordinates.GeoJSONType(),
	}

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
	for _, member := range relation.Members {
		if member.Type == osm.TypeRelation {
			s.parentIds[member.Ref] = relation.ID
		}
	}

	if getTagValue(relation.Tags, "type") == "boundary" &&
		getTagValue(relation.Tags, "boundary") == "administrative" {
		s.relations[relation.ID] = relation
	}
}

func (s *pbfScanner) printDot(format string, a ...any) {
	if s.i%25000 == 0 {
		fmt.Printf("%d: %s\n", s.i, fmt.Sprintf(format, a...))
	} else if s.i%500 == 0 {
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
					if pointsApproxEquals(line[0], ringLast) {
						ring = append(ring, line...) // good ordering, just append the ids
						b.success(lineId)
					} else if pointsApproxEquals(line[len(line)-1], ringLast) {
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

		if pointsApproxEquals(ring[0], ring[len(ring)-1]) {
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

import { VercelRequest } from "@vercel/node";
import { getSiteUrl } from "./vercel";

interface Level1 {
  level1_id: string
  name: string
  type: string
  level2s: Level2[]
}

interface Level2 {
  level2_id: string
  name: string
  type: string
  level3s: Level3[]
}

interface Level3 {
  level3_id: string
  name: string
  type: string
}

type Bbox = number[]
type Coordinates = number[][][]
interface PreparedData {
  id: string
  name: string
  type: string

  detail: string

  bbox?: Bbox
  geometry?: {
    type: string
    coordinates: Coordinates
  }
}

interface GisLevel1 {
  level1_id: string
  name: string

  bbox: Bbox
  type: string
  coordinates: Coordinates

  level2s: GisLevel2[]
}

interface GisLevel2 {
  level2_id: string
  name: string

  bbox: Bbox
  type: string
  coordinates: Coordinates
}

const dvhcvn = require("../../data/dvhcvn") as { data: Level1[] };
export const data = dvhcvn.data;

const gis: Record<string, GisLevel1> = {};
for (const level1 of data) {
  gis[level1.level1_id] = require(`../../data/gis/${level1.level1_id}.json`);
}

interface PrepareLevel1Options {
  gis?: boolean
  req?: VercelRequest
}
export function prepareLevel1(level1: Level1, options: PrepareLevel1Options = {}): PreparedData {
  const { level1_id: id, name, type } = level1
  const { req } = options
  const detail = req ? `${getSiteUrl(req)}/api/${id}` : undefined

  let prepared: PreparedData = { id, name, type, detail }

  if (options.gis === true) {
    const thisGis = gis[id];
    const { bbox, coordinates, type } = thisGis || {};
    prepared = { ...prepared, bbox, geometry: { coordinates, type } }
  }

  return prepared;
}

interface PrepareLevel2Options {
  gis?: boolean
  level1?: Level1
  req?: VercelRequest
}
export function prepareLevel2(level2: Level2, options: PrepareLevel2Options = {}): PreparedData {
  const { level2_id: id, name, type } = level2

  const { level1, req } = options
  const detail = (level1 && req) ? `${getSiteUrl(req)}/api/${level1.level1_id}/${id}` : undefined

  let prepared: PreparedData = { id, name, type, detail }

  if (level1 && options.gis === true) {
    const { level2s: gisLevel2s } = gis[level1.level1_id];
    for (const gisLevel2 of gisLevel2s) {
      if (gisLevel2.level2_id !== id) continue;
      const { bbox, coordinates, type } = gisLevel2
      prepared = { ...prepared, bbox, geometry: { coordinates, type } }
    }
  }

  return prepared;
}

interface PrepareLevel3Options {
  level1?: Level1
  level2?: Level2
  req?: VercelRequest
}
export function prepareLevel3(level3: Level3, options: PrepareLevel3Options = {}): PreparedData {
  const { level3_id: id, name, type } = level3

  const { level1, level2, req } = options
  const detail = (level1 && level2 && req) ?
    `${getSiteUrl(req)}/api/${level1.level1_id}/${level2.level2_id}/${id}` :
    undefined

  return { id, name, type, detail }
}

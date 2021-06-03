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

const { data } = require("../../data/dvhcvn");

export default data as Level1[];

export function prepareLevel1(req: VercelRequest, level1: Level1) {
  const { level1_id: id, name, type } = level1
  const level2s = `${getSiteUrl(req)}/api/${id}`
  return { id, name, type, level2s }
}

export function prepareLevel2(req: VercelRequest, level1: Level1, level2: Level2) {
  const { level2_id: id, name, type } = level2
  const level3s = `${getSiteUrl(req)}/api/${level1.level1_id}/${id}`
  return { id, name, type, level3s }
}

export function prepareLevel3(level3: Level3) {
  const { level3_id: id, name, type } = level3
  return { id, name, type }
}
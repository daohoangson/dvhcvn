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

const dvhcvn = require("../../data/dvhcvn") as { data: Level1[] };
export const data = dvhcvn.data;


interface PrepareLevel1Options {
  req?: VercelRequest
}
export function prepareLevel1(level1: Level1, options: PrepareLevel1Options = {}) {
  const { level1_id: id, name, type } = level1
  const { req } = options
  const level2s = req ? `${getSiteUrl(req)}/api/${id}` : undefined

  return { id, name, type, level2s }
}

interface PrepareLevel2Options {
  level1?: Level1
  req?: VercelRequest
}
export function prepareLevel2(level2: Level2, options: PrepareLevel2Options = {}) {
  const { level2_id: id, name, type } = level2

  const { level1, req } = options
  const level3s = (level1 && req) ? `${getSiteUrl(req)}/api/${level1.level1_id}/${id}` : undefined

  return { id, name, type, level3s }
}

export function prepareLevel3(level3: Level3) {
  const { level3_id: id, name, type } = level3
  return { id, name, type }
}
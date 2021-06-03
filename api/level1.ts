import { VercelRequest, VercelResponse } from "@vercel/node";

import { data, prepareLevel1, prepareLevel2 } from './utils/data';
import { getGis } from "./utils/vercel";

export default function (req: VercelRequest, res: VercelResponse) {
  const { level1Id } = req.query;
  const gis = getGis(req);
  const level2s = [];

  for (const level1 of data) {
    if (level1.level1_id !== level1Id) continue;
    for (const level2 of level1.level2s) {
      level2s.push(prepareLevel2(level2, { level1, req }))
    }

    return res.send({
      level1: prepareLevel1(level1, { gis }),
      level2s
    });
  }

  return res.status(404).send({ level2s });
}

import { VercelRequest, VercelResponse } from "@vercel/node";

import { data, prepareLevel1, prepareLevel2, prepareLevel3 } from './utils/data';

export default function (req: VercelRequest, res: VercelResponse) {
  const { level1Id, level2Id } = req.query;
  const level3s = [];

  for (const level1 of data) {
    if (level1.level1_id !== level1Id) continue;
    for (const level2 of level1.level2s) {
      if (level2.level2_id !== level2Id) continue;
      for (const level3 of level2.level3s) {
        level3s.push(prepareLevel3(level3))
      }

      return res.send({
        level1: prepareLevel1(level1),
        level2: prepareLevel2(level2),
        level3s
      });
    }
  }

  return res.status(404).send({ level3s });
}

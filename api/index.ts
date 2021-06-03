import { VercelRequest, VercelResponse } from "@vercel/node";

import { data, prepareLevel1 } from './utils/data';

export default function (req: VercelRequest, res: VercelResponse) {
  const level1s = [];

  for (const level1 of data) {
    level1s.push(prepareLevel1(req, level1))
  }

  return res.send({ level1s });
}

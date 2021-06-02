import { NowRequest, NowResponse } from "@now/node";

const { data } = require("../../data/dvhcvn");

export default function (_: NowRequest, res: NowResponse) {
  const level1s = [];

  for (const level1 of data) {
    const { level1_id, name, type } = level1
    level1s.push({ id: level1_id, name, type })
  }

  return res.send(level1s);
}

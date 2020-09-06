import { NowRequest, NowResponse } from "@now/node";

import Parser from "../src/parser";

const parser = new Parser();

export default function (req: NowRequest, res: NowResponse) {
  if (typeof req.body === "string") {
    return res.send(parser.parse(req.body));
  }

  if (req.body && typeof req.body.input === "string") {
    const parsed = parser.parse(req.body.input);
    return res.send(parsed.map(r => `${r.type} ${r.name}`).join(", "));
  }

  return res.status(400).send('No input found.');
}

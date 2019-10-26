import { NowRequest, NowResponse } from "@now/node";

import Parser from "../src/parser";

const parser = new Parser();

export default function(req: NowRequest, res: NowResponse) {
  if (typeof req.body === "string") {
    return res.send(parser.parse(req.body));
  } else {
    return res.status(400);
  }
}

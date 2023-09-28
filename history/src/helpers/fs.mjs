// @ts-check

import { readFile } from "fs";

/**
 * @returns {Promise<string>}
 */
export function getKey() {
  return new Promise((resolve) =>
    readFile("./data/key.txt", { encoding: "utf8" }, (err, data) =>
      resolve(err ? "" : data)
    )
  );
}

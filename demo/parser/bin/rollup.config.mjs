// @ts-check

import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

/** @type {import("rollup").RollupOptions} */
export default {
  input: "bin/cli.ts",
  plugins: [json(), typescript()],
  output: {
    file: "bin/cli.js",
    format: "cjs",
  },
};

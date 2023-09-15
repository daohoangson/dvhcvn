// @ts-check

import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

/** @type {import("rollup").RollupOptions} */
export default {
  input: "api/vercel.ts",
  plugins: [json(), typescript()],
  output: {
    file: "api/index.js",
    format: "cjs",
  },
};

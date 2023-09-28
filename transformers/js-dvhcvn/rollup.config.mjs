// @ts-check

import typescript from "@rollup/plugin-typescript";

/** @type {import("rollup").RollupOptions} */
export default {
  input: "src/index.ts",
  plugins: [typescript()],
  output: {
    file: "lib/index.js",
    format: "cjs",
  },
};

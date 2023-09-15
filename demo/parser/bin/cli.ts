#!npx ts-node

import process from "node:process";
import readline from "node:readline";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import Parser from "../src/parser.ts";

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .help()
    .option("debug", {
      boolean: true,
      description: "Run with debug output",
    })
    .option("json", {
      boolean: true,
      description: "Json decode input before parsing",
    })
    .alias("h", "help").argv;

  const { debug, json } = argv;
  const parser = new Parser({ debug });

  const parseInput = (input: string) => {
    if (json) {
      const decoded = JSON.parse(input);
      if (decoded && typeof decoded.input === "string") {
        input = decoded.input;
      }
    }

    process.stdout.write(
      JSON.stringify({ input, output: parser.parse(input) }) + "\n"
    );
  };

  const inputs = argv._;
  if (inputs.length > 0) {
    inputs.forEach(parseInput);
    process.exit(0);
  }

  const rl = readline.createInterface({ input: process.stdin });
  rl.on("line", parseInput);
}

main().catch(console.error);

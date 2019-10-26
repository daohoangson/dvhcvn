#!npx ts-node

import readline from "readline";
import yargs from "yargs";

import Parser from "../src/parser";

const argv = yargs
  .help()
  .option("debug", {
    boolean: true,
    description: "Run with debug output"
  })
  .alias("h", "help").argv;

const parser = new Parser({
  debug: argv.debug
});

const parseInput = input =>
  process.stdout.write(
    JSON.stringify({ input, output: parser.parse(input) }) + "\n"
  );

const inputs = argv._;
if (inputs.length > 0) {
  inputs.forEach(parseInput);
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", parseInput);

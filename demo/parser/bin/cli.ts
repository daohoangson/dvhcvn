import process from "node:process";
import readline from "node:readline";
import minimist from "minimist";

import Parser from "../src/parser.ts";

async function main() {
  const argv = minimist(process.argv.slice(2));
  const { debug } = argv;
  const parser = new Parser({ debug: debug === true });

  const parseInput = (input: string) => {
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

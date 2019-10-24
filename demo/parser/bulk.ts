import { readFileSync } from 'fs';

import Parser from './src/parser';

const parser = new Parser();

const lines = readFileSync(0).toString().split("\n");

lines.forEach(input => {
  const output = parser.parse(input);
  console.log(JSON.stringify({ input, output }));
});

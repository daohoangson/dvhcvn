import { readFileSync } from 'fs';

import Parser from './src/parser';

const parser = new Parser();

const lines = readFileSync(0).toString().split("\n");

lines.forEach(line => {
  line = line.trim();
  if (line.length < 1) return;

  const parsed = parser.parse(line);
  if (parsed.length > 1) return;
  console.log(line, parsed);
});

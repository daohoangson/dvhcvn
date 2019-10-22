import Parser from './src/parser';

const parser = new Parser({ debug: true });
const address = process.argv[2];
const result = parser.parse(address);
console.log(address, result);

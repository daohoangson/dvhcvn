import { readFileSync } from 'fs'

const stdout = {
  write: (msg: string) => process.stdout.write(msg),
  writeln: (msg: string = '') => process.stdout.write(`${msg}\n`)
}

const types: { [key: string]: string } = {
  'Thành phố Trung ương': 'tptw',
  Tỉnh: 'tinh',
  'Thành phố': 'tp',
  Quận: 'quan',
  Huyện: 'huyen',
  Phường: 'phuong',
  Xã: 'xa',
  'Thị trấn': 'thi_tran',
  'Thị xã': 'thi_xa'
}

function main (args: string[]): void {
  stdout.writeln("import { Level1, Level2, Level3, Type } from './model';")
  stdout.writeln()

  stdout.write('export const level1s = [')

  const txt = readFileSync(args[0], 'utf8')
  const json = JSON.parse(txt)
  const data = json.data as any[]
  for (var i = 0; i < data.length; i++) {
    _processLevel1(i, data[i])
  }

  stdout.write('];')
}

function _getString (str: string): string {
  if (!str.includes("'")) return `'${str}'`
  if (!str.includes('"')) return `"${str}"`
  return "'" + str.replace("'", "\\'") + "'"
}

function _getType (str: string): string {
  if (str in types) return `Type.${types[str]}`
  throw new Error(`Type not found: ${str}`)
}

function _processLevel1 (level1Index: number, level1: any): void {
  const id = _getString(level1.level1_id)
  const name = _getString(level1.name)
  const type = _getType(level1.type)
  stdout.write(`new Level1(${id}, ${name}, ${type}, [\n`)

  const level2s = level1.level2s as any[]
  for (var i = 0; i < level2s.length; i++) {
    _processLevel2(level1Index, i, level2s[i])
  }

  stdout.writeln(']),')
}

function _processLevel2 (level1Index: number, level2Index: number, level2: any): void {
  const id = _getString(level2.level2_id)
  const name = _getString(level2.name)
  const type = _getType(level2.type)
  stdout.write(`new Level2(${level1Index}, ${id}, ${name}, ${type}, [\n`)

  const level3s = level2.level3s as any[]
  for (const level3 of level3s) {
    _processLevel3(level1Index, level2Index, level3)
  }

  stdout.writeln(']),')
}

function _processLevel3 (level1Index: number, level2Index: number, level3: any): void {
  const id = _getString(level3.level3_id)
  const name = _getString(level3.name)
  const type = _getType(level3.type)
  stdout.writeln(`new Level3(${level1Index}, ${level2Index}, ${id}, ${name}, ${type}),`)
}

if (require.main === module) {
  main(process.argv.slice(process.argv.indexOf(__filename) + 1))
}

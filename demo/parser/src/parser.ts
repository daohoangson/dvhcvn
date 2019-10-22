import unidecode from 'unidecode';

import { getAsciiAccent } from './vietnamese';

const getInitials = (s: string): string =>
  s.split(/\s+/).map(word => word.charAt(0)).join('');

const typeTranslations = {
  'tinh': ['province'],
  'thanh pho': ['city'],
  'quan': ['district', 'dist'],
  'phuong': ['ward'],
};

const tryToMatch = (address: string, candidate: Unit) => {
  const address2 = (unidecode(address) as string).toLowerCase();
  const { regExp, asciiNames } = candidate.getRegExp();
  const regExpMatch = address2.match(regExp);
  if (regExpMatch === null) return null;

  const match0 = address.substr(address.length - regExpMatch[0].length);
  const matchAscii = getAsciiAccent(match0);
  const matchAsciiFound = asciiNames.reduce((prev, asciiName) => {
    if (prev.length > asciiName.length) return prev;
    if (matchAscii.indexOf(asciiName) > -1) return asciiName;
    return prev;
  }, '');
  if (matchAsciiFound === null) return null;

  return new Match(candidate, match0);
}

class Match {
  private match: string
  private unit: Unit

  constructor(unit: Unit, match: string) {
    this.match = match;
    this.unit = unit;
  }

  getUnit() { return this.unit; }

  length() { return this.match.length; }

  toString() { return this.match; }
}

export class ResultUnit {
  id: string | undefined
  name: string | number
  type: string | undefined

  private constructor() { }

  static fromMatch(match: Match) {
    const unit = match.getUnit();
    const resultUnit = new ResultUnit();
    resultUnit.id = unit.id;
    resultUnit.name = unit.name;
    resultUnit.type = unit.type;
    return resultUnit;
  }

  toString() { return `${this.type} ${this.name}`; }
}

class Unit {
  id: string | undefined
  name: string | number
  type: string | undefined

  private regExp: RegExp | undefined
  private asciiNames: string[] | undefined

  private children: Unit[]

  constructor(json: any) {
    if (typeof json[1] !== 'string') {
      throw Error('Invalid json');
    }

    this.id = json[0]
    this.name = json[1]
    this.type = json[2]

    if (this.name.match(/^[0-9]+$/)) {
      this.name = parseInt(this.name);
    }

    if (json[4]) {
      this.children = (json[4] as any[]).map((j) => new Unit(j));
    } else {
      this.children = [];
    }
  }

  getChildren() { return this.children; }

  getRegExp() {
    if (this.regExp !== undefined && this.asciiNames !== undefined) return {
      regExp: this.regExp,
      asciiNames: this.asciiNames,
    };

    const name = (unidecode(`${this.name}`) as string).toLowerCase();
    const type = this.type !== undefined
      ? (unidecode(this.type) as string).toLowerCase()
      : undefined;
    const typeInitialGlue = '[. ]*';

    const patterns: string[] = [];
    this.asciiNames = [];
    let nameInitials: string | undefined;

    if (typeof this.name === 'number') {
      this.asciiNames.push(name);
    } else {
      patterns.push(name);
      this.asciiNames.push(getAsciiAccent(this.name));

      if (this.isLevel1() && name.indexOf(' ') > -1) {
        nameInitials = getInitials(name);
        patterns.push(nameInitials);
        this.asciiNames.push(getAsciiAccent(getInitials(this.name)));
      }

      const nameWithoutSpace = name.replace(/\s/g, '');
      if (nameWithoutSpace !== name) {
        patterns.push(nameWithoutSpace);
        patterns.push(`${type} ${nameWithoutSpace}`);

        this.asciiNames.push(getAsciiAccent(this.name.replace(/\s/g, '')))
        this.asciiNames.push(nameWithoutSpace);
      }
    }

    if (type !== undefined) {
      patterns.push(`${type} ${name}`);

      if (typeof typeTranslations[type] !== 'undefined') {
        (typeTranslations[type] as string[]).forEach(type2 => {
          patterns.push(`${type2} ${name}`)

          const nameWithType2 = `${name} ${type2}`;
          patterns.push(nameWithType2);

          if (nameInitials !== undefined) {
            patterns.push(getInitials(nameWithType2));
          }
        });
      }

      const typeInitials = [getInitials(type)];
      if (typeInitials[0] === 'p') {
        // special case: phường -> "p" or "f"
        typeInitials.push('f');
      }
      typeInitials.forEach(typeInitial => {
        patterns.push(`${typeInitial}${typeInitialGlue}${name}`);

        if (nameInitials !== undefined) {
          patterns.push(`${typeInitial}${typeInitialGlue}${nameInitials}`);
        }
      });
    }

    this.regExp = new RegExp((patterns.length > 1 ? ('(' + patterns.join('|') + ')') : patterns[0]) + '$');

    return { regExp: this.regExp, asciiNames: this.asciiNames };
  }

  isLevel1() { return this.type === 'Tỉnh' || this.type === 'Thành phố' }
}

export default class Parser {
  private root: Unit;

  constructor() {
    const sorted = require('../../../data/sorted') as any[];
    this.root = new Unit([undefined, "Việt Nam", undefined, undefined, sorted])
  }

  parse(address: string): ResultUnit[] {
    if (address.indexOf('@') > -1) return [];
    if (address.match(/^[0-9\s]+$/)) return [];

    const matches = this.resolveNext(address, [this.root], []);
    const units = matches.map(m => ResultUnit.fromMatch(m));

    // remove the root unit
    if (units.length > 0 && units[0].id === undefined) units.shift();

    // reverse it for more logical result
    const reversed = units.reverse();

    return reversed;
  }

  private resolveNext(address: string, candidates: Unit[], parents: Match[]): Match[] {
    address = address.replace(/[ .,-]+$/, '');

    let found: {
      candidates: { [id: string]: Unit },
      match: Match,
    } | undefined;
    candidates.forEach(candidate => {
      const match = tryToMatch(address, candidate);
      if (match === null) return;

      let updateFound = false;
      if (found === undefined) {
        updateFound = true;
      } else {
        if (found.match.length() < match.length()) {
          updateFound = true;
        } else if (found.match.length() === match.length()) {
          found.candidates[candidate.id] = candidate;
        }
      }
      if (updateFound) {
        found = {
          candidates: { [candidate.id]: candidate },
          match,
        }
      }
    });

    if (found === undefined) {
      return this.resolveSkipping(address, candidates, parents);
    }

    const addressTruncated = address.substr(0, address.length - found.match.length());
    const candidateIds = Object.keys(found.candidates);

    if (candidateIds.length === 1) {
      const matches = [...parents, found.match];
      const children = found.match.getUnit().getChildren();
      if (children.length === 0) return matches;

      return this.resolveNext(addressTruncated, children, matches);
    }

    return this.resolveSkipping(addressTruncated, Object.values(found.candidates), parents);
  }

  private resolveSkipping(address: string, skips: Unit[], parents: Match[]) {
    let found: {
      matchesArr: Match[],
      matchesStr: string,
      sameLengthCount: number,
    } | undefined;
    skips.forEach(skip => {
      const candidates = skip.getChildren();
      if (candidates.length === 0) return;

      const tmp = this.resolveNext(address, candidates, parents);
      if (tmp.length < parents.length) return;

      const matches = tmp.slice(parents.length);
      let matchesStr = '';
      matches.forEach(m => matchesStr += m.toString());

      let updateFound = false;
      if (found === undefined) {
        updateFound = true;
      } else {
        if (found.matchesStr.length < matchesStr.length) {
          updateFound = true;
        } else if (found.matchesStr.length === matchesStr.length) {
          found.sameLengthCount++;
        }
      }
      if (updateFound) {
        found = {
          matchesArr: [new Match(skip, ''), ...matches],
          matchesStr,
          sameLengthCount: 1,
        }
      }
    });

    if (found === undefined) return parents;
    if (found.sameLengthCount > 1) return parents;

    return [...parents, ...found.matchesArr];
  }
}

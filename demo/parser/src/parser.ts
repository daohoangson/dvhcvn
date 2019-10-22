import unidecode from "unidecode";

import { getAsciiAccent, getInitials } from "./vietnamese";

const typeTranslations = {
  tinh: ["province"],
  "thanh pho": ["city"],
  quan: ["district", "dist"],
  phuong: ["ward"]
};

class Match {
  private id: string | undefined;
  private name: string | number;
  private type: string | undefined;

  private match: string;

  constructor(unit: Unit, match: string) {
    this.id = unit.id;
    this.name = unit.name;
    this.type = unit.type;

    this.match = match;
  }

  getResults() {
    const { id, name, type } = this;
    return { id, name, type };
  }

  length() {
    return this.match.length;
  }

  toString() {
    return this.match;
  }
}

class Unit {
  id: string | undefined;
  level: number;
  name: string | number;
  type: string | undefined;

  private regExp: RegExp | undefined;
  private asciiNames: string[] | undefined;

  private children: Unit[];

  constructor(json: any, level: number) {
    if (typeof json[1] !== "string") {
      throw Error("Invalid json");
    }

    this.id = json[0];
    this.level = level;
    this.name = json[1];
    this.type = json[2];

    if (this.name.match(/^[0-9]+$/)) {
      this.name = parseInt(this.name);
    }

    if (json[4]) {
      this.children = (json[4] as any[]).map(j => new Unit(j, level + 1));
    } else {
      this.children = [];
    }
  }

  getChildren() {
    return this.children;
  }

  getRegExp() {
    if (this.regExp !== undefined && this.asciiNames !== undefined)
      return {
        regExp: this.regExp,
        asciiNames: this.asciiNames
      };

    const name = (unidecode(`${this.name}`) as string).toLowerCase();
    const type =
      this.type !== undefined
        ? (unidecode(this.type) as string).toLowerCase()
        : undefined;
    const typeInitialGlue = "[. ]*";

    const patterns: string[] = [];
    this.asciiNames = [];
    let nameInitials: string | undefined;

    if (typeof this.name === "number") {
      this.asciiNames.push(name);
    } else {
      patterns.push(name);
      this.asciiNames.push(getAsciiAccent(this.name));

      if (this.level === 1 && name.indexOf(" ") > -1) {
        nameInitials = getInitials(name);
        patterns.push(nameInitials);
        this.asciiNames.push(getAsciiAccent(getInitials(this.name)));
      }

      const nameWithoutSpace = name.replace(/\s/g, "");
      if (nameWithoutSpace !== name) {
        patterns.push(nameWithoutSpace);
        patterns.push(`${type} ${nameWithoutSpace}`);

        this.asciiNames.push(getAsciiAccent(this.name.replace(/\s/g, "")));
        this.asciiNames.push(nameWithoutSpace);
      }
    }

    if (type !== undefined) {
      patterns.push(`${type} ${name}`);

      if (typeof typeTranslations[type] !== "undefined") {
        (typeTranslations[type] as string[]).forEach(type2 => {
          patterns.push(`${type2} ${name}`);

          const nameWithType2 = `${name} ${type2}`;
          patterns.push(nameWithType2);

          if (nameInitials !== undefined) {
            patterns.push(getInitials(nameWithType2));
          }
        });
      }

      const typeInitials = [getInitials(type)];
      if (typeInitials[0] === "p") {
        // special case: phường -> "p" or "f"
        typeInitials.push("f");
      }
      typeInitials.forEach(typeInitial => {
        patterns.push(`${typeInitial}${typeInitialGlue}${name}`);

        if (nameInitials !== undefined) {
          patterns.push(`${typeInitial}${typeInitialGlue}${nameInitials}`);
        }
      });
    }

    this.regExp = new RegExp(
      (patterns.length > 1 ? "(" + patterns.join("|") + ")" : patterns[0]) + "$"
    );

    return { regExp: this.regExp, asciiNames: this.asciiNames };
  }
}

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
  }, "");
  if (matchAsciiFound === null) return null;

  return new Match(candidate, match0);
};

type ResolveOption = {
  matches: Match[];
  matched: string;
  score: number;
};

class ResolveOptions {
  private resolveId: number;
  private count: { [score: number]: number } = {};
  private options: { [score: number]: ResolveOption } = {};

  constructor(resolveId: number) {
    this.resolveId = resolveId;
  }

  best() {
    const score = this.bestScore();
    if (!score) return null;
    return this.options[score];
  }

  bestScore() {
    return Object.keys(this.count).map(s => parseInt(s))
      .reduce((best, score) => {
        if (this.count[score] > 1) return best;
        if (!best || best < score) return score;
        return best;
      }, 0);
  }

  getResolveId() { return this.resolveId; }

  update = (parents: Match[], resolved: Match[], skip: Unit) => {
    if (!(resolved.length > parents.length)) return;

    const slice = resolved.slice(parents.length);
    const matches = skip ? [new Match(skip, ""), ...slice] : slice;
    let matched = '';
    let skipped = 0;
    matches.forEach(m => {
      if (m.length() > 0) {
        matched += m.toString();
      } else {
        skipped++;
      }
    })
    const score = matched.length * 10 - skipped;
    const self = { matches, matched, score };

    if (typeof this.count[score] === 'number') {
      this.count[score]++;
      delete this.options[score];
    } else {
      this.count[score] = 1;
      this.options[score] = self;
    }
  }
}

type ParserOptions = {
  debug?: boolean
}

export default class Parser {
  private debug = false;
  private root: Unit;
  private resolveCount = 0;

  constructor(options?: ParserOptions) {
    const sorted = require("../../../data/sorted") as any[];
    this.root = new Unit(
      [undefined, "Việt Nam", undefined, undefined, sorted],
      0
    );

    if (options) {
      this.debug = !!options.debug;
    }
  }

  parse(address: string) {
    if (address.indexOf("@") > -1) return [];
    if (address.match(/^[0-9\s]+$/)) return [];

    const matches = this.resolveNext(address, [this.root], []);
    const results = matches.map(m => m.getResults());

    // remove the root unit
    if (results.length > 0 && results[0].id === undefined) results.shift();

    // reverse it for more logical result
    const reversed = results.reverse();

    return reversed;
  }

  private log(message: string, ...args) {
    if (!this.debug) return;
    console.log.apply(console, [message, ...args]);
  }

  private resolveNext(
    address: string,
    candidates: Unit[],
    parents: Match[]
  ): Match[] {
    address = address.replace(/[ .,-]+$/, "");

    const options = new ResolveOptions(this.resolveCount++);
    candidates.forEach(candidate => {
      const match = tryToMatch(address, candidate);
      if (match !== null) {
        const addressTruncated = address.substr(0, address.length - match.length());
        const children = candidate.getChildren();
        const parentsAndMatch = [...parents, match];
        const resolved = children.length > 0
          ? this.resolveNext(addressTruncated, children, parentsAndMatch)
          : parentsAndMatch;

        options.update(parents, resolved, null);
      }
    });

    const bestBefore = options.best();
    if (bestBefore) this.log('resolveNext: %s -> #%d, bestBefore=', address, options.getResolveId(), bestBefore);

    const skippingResolved = this.resolveSkipping(address, candidates, parents);
    options.update(parents, skippingResolved, null);
    const bestAfter = options.best();
    if (bestAfter) {
      if (bestAfter !== bestBefore) {
        this.log('resolveNext: %s -> #%d, bestAfter=', address, options.getResolveId(), bestAfter);
      } else {
        this.log('resolveNext: %s -> #%d, bestAfter == bestBefore', address, options.getResolveId());
      }
    }

    if (!bestAfter) {
      if (!bestBefore) {
        return parents;
      } else {
        return [...parents, ...bestBefore.matches];
      }
    } else {
      return [...parents, ...bestAfter.matches];
    }
  }

  private resolveSkipping(address: string, skips: Unit[], parents: Match[]) {
    const options = new ResolveOptions(this.resolveCount++);
    skips.forEach(skip => {
      const candidates = skip.getChildren();
      if (candidates.length === 0) return;

      const resolved = this.resolveNext(address, candidates, parents);

      const bestBefore = options.best();
      options.update(parents, resolved, skip);
      const bestAfter = options.best();

      if (bestAfter !== bestBefore) this.log('resolveSkipping: %s -> #%d, best=', address, options.getResolveId(), bestAfter);
    });

    const best = options.best();
    return best ? [...parents, ...best.matches] : parents;
  }
}

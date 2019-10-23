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

  length: number;
  level: number;
  match: string;

  constructor(unit: Unit, match: string) {
    this.id = unit.id;
    this.name = unit.name;
    this.type = unit.type;

    this.length = match.length;
    this.level = unit.level;
    this.match = match;
  }

  getResults() {
    const { id, name, type } = this;
    return { id, name, type };
  }
}

class Unit {
  id: string | undefined;
  level: number;
  name: string | number;
  type: string | undefined;

  private regExp: RegExp | undefined;
  private expectedMatches: string[] | undefined;

  private _children: Unit[] | undefined;

  constructor(json: any, level = 0) {
    const [id, name, type, _, children] = json;
    this.id = id;

    this.level = level;

    if (typeof name !== "string") throw Error("Invalid name in json: " + name);
    this.name = name.match(/^[0-9]+$/) ? parseInt(name) : name;

    this.type = type;

    this._children = children
      ? (json[4] as any[]).map(j => new Unit(j, level + 1))
      : undefined;
  }

  children() {
    return this._children || [];
  }

  hasChildren() {
    return this._children !== undefined && this._children.length > 0;
  }

  prepare() {
    if (this.regExp !== undefined && this.expectedMatches !== undefined)
      return {
        expectedMatches: this.expectedMatches,
        regExp: this.regExp
      };

    const name = (unidecode(`${this.name}`) as string).toLowerCase();
    const type =
      this.type !== undefined
        ? (unidecode(this.type) as string).toLowerCase()
        : undefined;
    const typeInitialGlue = "[. ]*";

    this.expectedMatches = [];
    const patterns: string[] = [];
    let nameInitials: string | undefined;

    if (typeof this.name === "number") {
      this.expectedMatches.push(name.toString());
    } else {
      patterns.push(name);
      this.expectedMatches.push(name.toLowerCase());
      this.expectedMatches.push(getAsciiAccent(this.name));

      if (name.indexOf(" ") > -1) {
        nameInitials = getInitials(name);
        patterns.push(nameInitials);
        this.expectedMatches.push(getAsciiAccent(getInitials(this.name)));
      }

      const nameWithoutSpace = name.replace(/\s/g, "");
      if (nameWithoutSpace !== name) {
        patterns.push(nameWithoutSpace);
        patterns.push(`${type} ${nameWithoutSpace}`);

        this.expectedMatches.push(getAsciiAccent(this.name.replace(/\s/g, "")));
        this.expectedMatches.push(nameWithoutSpace.toLowerCase());
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

    return { regExp: this.regExp, expectedMatches: this.expectedMatches };
  }
}

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
    return Object.keys(this.count)
      .map(s => parseInt(s))
      .reduce((best, score) => {
        if (this.count[score] > 1) return best;
        if (!best || best < score) return score;
        return best;
      }, 0);
  }

  getResolveId() {
    return this.resolveId;
  }

  update = (parents: Match[], resolved: Match[], skip: Unit) => {
    if (!(resolved.length > parents.length)) return;

    const slice = resolved.slice(parents.length);
    const matches = skip ? [new Match(skip, ""), ...slice] : slice;
    let matched = "";
    let skipped = 0;
    matches.forEach(m => {
      if (m.length > 0) {
        matched += m.match;
      } else {
        skipped++;
      }
    });
    const score = matched.length * 10 - skipped;
    const self = { matches, matched, score };

    if (typeof this.count[score] === "number") {
      this.count[score]++;
      delete this.options[score];
    } else {
      this.count[score] = 1;
      this.options[score] = self;
    }
  };
}

type ParserOptions = {
  debug?: boolean;
};

export default class Parser {
  private debug = false;
  private root: Unit;
  private resolveCount = 0;

  constructor(options?: ParserOptions) {
    const sorted = require("../../../data/sorted") as any[];
    this.root = new Unit([undefined, "Việt Nam", undefined, undefined, sorted]);

    if (options) {
      this.debug = !!options.debug;
    }
  }

  parse(address: string) {
    if (address.indexOf("@") > -1) return [];

    // remove phone number, post code, etc.
    address = address.replace(/[0-9]{4,}/g, "");

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
      const match = this.tryToMatch(address, candidate);
      if (match !== null) {
        const addressNext = address.substr(0, address.length - match.length);
        const parentsNext = [...parents, match];
        const resolved = candidate.hasChildren()
          ? this.resolveNext(addressNext, candidate.children(), parentsNext)
          : parentsNext;

        options.update(parents, resolved, null);
      }
    });

    const bestBefore = options.best();
    if (bestBefore)
      this.log(
        "resolveNext: %s -> #%d, bestBefore=",
        address,
        options.getResolveId(),
        bestBefore
      );

    const skippingResolved = this.resolveSkipping(address, candidates, parents);
    options.update(parents, skippingResolved, null);
    const bestAfter = options.best();
    if (bestAfter) {
      if (bestAfter !== bestBefore) {
        this.log(
          "resolveNext: %s -> #%d, bestAfter=",
          address,
          options.getResolveId(),
          bestAfter
        );
      } else {
        this.log(
          "resolveNext: %s -> #%d, bestAfter == bestBefore",
          address,
          options.getResolveId()
        );
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
    const lastParent = parents.length > 0 ? parents[parents.length - 1] : null;
    const lastLevel = lastParent ? lastParent.level : -1;

    const options = new ResolveOptions(this.resolveCount++);
    skips.forEach(skip => {
      // do not skip too far from the latest parent
      if (skip.level > lastLevel + 2) return;

      if (!skip.hasChildren()) return;
      const resolved = this.resolveNext(address, skip.children(), parents);

      const bestBefore = options.best();
      options.update(parents, resolved, skip);
      const bestAfter = options.best();

      if (bestAfter !== bestBefore)
        this.log(
          "resolveSkipping: %s -> #%d, best=",
          address,
          options.getResolveId(),
          bestAfter
        );
    });

    const best = options.best();
    return best ? [...parents, ...best.matches] : parents;
  }

  tryToMatch(address: string, candidate: Unit) {
    const address2 = (unidecode(address) as string).toLowerCase();
    const { expectedMatches, regExp } = candidate.prepare();
    const regExpMatch = address2.match(regExp);
    if (regExpMatch === null) return null;

    const match = address.substr(address.length - regExpMatch[0].length);
    const match2 = getAsciiAccent(match);
    const found = expectedMatches.reduce((prev, m) => {
      if (prev.length > m.length) return prev;
      if (match2.indexOf(m) > -1) return m;
      return prev;
    }, "");
    if (found === "") {
      this.log(
        "tryToMatch: %s =/= %d %s",
        match2,
        candidate.id,
        candidate.type,
        expectedMatches
      );
      return null;
    }

    this.log(
      "tryToMatch: %s === %d %s %s",
      match,
      candidate.id,
      candidate.type,
      candidate.name
    );
    return new Match(candidate, match);
  }
}

import unidecode from "unidecode";

import Entity from "./entity";
import { getAsciiAccent } from "./vietnamese";

export class Match {
  private id: string | undefined;
  private name: string | number;
  private type: string | undefined;

  length: number;
  level: number;
  match: string;

  constructor(entity: Entity, match: string) {
    this.id = entity.id;
    this.name = entity.name;
    this.type = entity.type;

    this.length = match.length;
    this.level = entity.level;
    this.match = match;
  }

  getResults() {
    const { id, name, type } = this;
    return { id, name, type };
  }
}

type ResolveOption = {
  matches: Match[];
  matched: string;
  score: number;
};

export const tryToMatch = (address: string, candidate: Entity) => {
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
  if (found === "") return null;

  return new Match(candidate, match);
};

export default class Matcher {
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

  update = (parents: Match[], resolved: Match[], skip: Entity) => {
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

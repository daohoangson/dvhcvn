import Entity, { delims } from "./entity";
import { deaccent, normalize } from "./vietnamese";

type Match = {
  id: string;
  level: number;
  name: string | number;
  type: string;

  address: string;
  match: string;
};

const newMatch = (entity: Entity, address = "", match = ""): Match => ({
  id: entity.id,
  level: entity.level,
  name: entity.name,
  type: entity.type,

  address: address,
  match: match
});

export class Matches {
  private matches: Match[];

  constructor(matches: Match[] = []) {
    this.matches = matches;
  }

  address() {
    if (this.matches.length < 1) return "";
    const { address, match } = this.matches[this.matches.length - 1];
    return address.substr(0, address.length - match.length);
  }

  last = () =>
    this.matches.length > 0 ? this.matches[this.matches.length - 1] : null;

  results = () =>
    this.matches.length > 0
      ? this.matches
          .map(({ id, name, type }) => ({ id, name, type }))
          .filter(r => !!r.id)
          .reverse()
      : null;

  score() {
    let matched = "";
    let skipped = 0;
    this.matches.forEach(m => {
      if (m.match.length > 0) {
        matched += m.match;
      } else {
        skipped++;
      }
    });
    return matched.length * 10 - skipped;
  }

  slice(parents: Matches, skippedEntity: Entity = null) {
    if (this.matches.length <= parents.matches.length) return;

    const slice = this.matches.slice(parents.matches.length);
    const matches = skippedEntity ? [newMatch(skippedEntity), ...slice] : slice;
    return new Matches(matches);
  }

  withMatch = (match: Match) => new Matches([...this.matches, match]);

  with = (other: Matches) => new Matches([...this.matches, ...other.matches]);
}

let matcherCount = 0;
const delimsRegExp = new RegExp(delims + "$");

export default class Matcher {
  id = ++matcherCount;

  private address: string;
  private address2: string;
  private count: { [score: number]: number } = {};
  private histories: {
    [score: number]: {
      matches: Matches;
      score: number;
    };
  } = {};
  private parents: Matches;

  constructor(address: string, parents: Matches) {
    this.address = address.replace(delimsRegExp, "");
    this.address2 = deaccent(this.address);

    this.parents = parents;
  }

  best() {
    const score = Object.keys(this.count)
      .map(s => parseInt(s))
      .reduce((best, score) => {
        if (this.count[score] > 1) return best;
        if (!best || best < score) return score;
        return best;
      }, 0);
    return score > 0 ? this.histories[score].matches : null;
  }

  try(entity: Entity) {
    const { address, address2, parents } = this;
    const { names, regExp } = entity.prepare();

    const m = address2.match(regExp);
    if (!m) return null;
    const { length } = m[0];

    if (entity.name2) {
      const match2 = address2.substr(address2.length - length);
      if (match2.indexOf(entity.name2) > -1) {
        return parents.withMatch(newMatch(entity, address, match2));
      }
    }

    const match = address.substr(address.length - length);
    const matchNormalized = normalize(match);
    const found = names.reduce((prev, m) => {
      if (prev.length > m.length) return prev;
      if (matchNormalized.indexOf(m) > -1) return m;
      return prev;
    }, "");
    if (found === "") return null;

    return parents.withMatch(newMatch(entity, address, match));
  }

  update(resolved: Matches, skippedEntity: Entity = null) {
    const matches = resolved.slice(this.parents, skippedEntity);
    if (!matches) return;

    const score = matches.score();
    const self = { matches, score };

    if (typeof this.count[score] === "number") {
      this.count[score]++;
      delete this.histories[score];
    } else {
      this.count[score] = 1;
      this.histories[score] = self;
    }
  }
}

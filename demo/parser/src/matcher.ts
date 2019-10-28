import Entity, { delims, getEntityById } from "./entity";
import { deaccent, normalize } from "./vietnamese";

const scorePerChar = 10;
const scoreDeltaSkip = -3;
const scoreDeltaInitials = -2;
const scoreDeltaName2 = -1;

export class Matches {
  address: string;
  entity: Entity = null;
  matches: string[] = [];
  scores: number[] = [];

  constructor(address: string) {
    this.address = address;
  }

  describe = () => ({
    match: this.entity ? [this.entity.describe(), this.scores] : undefined,
    address: [this.address, ...this.matches]
  });

  results() {
    const results = [];

    let entity = this.entity;
    while (entity && entity.id !== "root") {
      const { id, name, type } = entity;
      results.push({ id, name, type });
      entity = entity.parent;
    }

    return results;
  }

  score = () => this.scores.reduce((sum, s) => sum + s, 0);
}

let matcherCount = 0;
const delimsRegExp = new RegExp(delims + "$");

export default class Matcher {
  id = ++matcherCount;

  address: string;
  private address2: string;
  private count: { [score: number]: number } = {};
  private histories: { [score: number]: Matches } = {};
  private previous: Matches;

  constructor(address: string, matches: Matches) {
    this.address = address.replace(delimsRegExp, "");
    this.address2 = deaccent(this.address);

    this.previous = matches;
  }

  best() {
    const scores = Object.keys(this.count).map(s => parseInt(s));
    const score = scores.length > 0 ? Math.max(...scores) : 0;
    return score > 0 && this.count[score] > 1 ? null : this.histories[score];
  }

  try(entity: Entity) {
    const { address, address2 } = this;
    const { initials, names, names2, regExp } = entity.prepare();
    if (!regExp) return null;

    const regExpMatch = address2.match(regExp);
    if (!regExpMatch) return null;
    const { length } = regExpMatch[0];

    const match = address.substr(address.length - length);
    const matchNormalized = normalize(match);
    const nameFound = names.reduce((prev, n) => {
      if (prev && prev.length > n.length) return prev;
      if (matchNormalized.indexOf(n) > -1) return n;
      return prev;
    }, null);
    if (nameFound) return this.ok(address, entity, match);

    const initialsFound = initials.reduce((prev, i) => {
      if (prev && prev.length > i.length) return prev;
      if (match.indexOf(i) > -1) return i;
      return prev;
    }, null);
    if (initialsFound)
      return this.ok(address, entity, match, scoreDeltaInitials);

    const match2 = address2.substr(address2.length - length);
    const name2Found = names2.reduce((prev, n) => {
      if (prev && prev.length > n.length) return prev;
      if (match2.indexOf(n) > -1) return n;
      return prev;
    }, null);
    if (name2Found) return this.ok(address, entity, match2, scoreDeltaName2);

    return null;
  }

  update(matches: Matches) {
    const score = matches.score();

    if (typeof this.count[score] === "number") {
      const thisLast = matches.entity;
      const otherLast = this.histories[score]
        ? this.histories[score].entity
        : null;
      if (
        otherLast &&
        thisLast.name == otherLast.name &&
        thisLast.parent === otherLast.parent
      ) {
        // special case: one parent has more than one entity
        // with the same name -> keep the first one that matched
      } else {
        this.count[score]++;
        delete this.histories[score];
      }
    } else {
      this.count[score] = 1;
      this.histories[score] = matches;
    }
  }

  private ok(address: string, entity: Entity, match: string, scoreDelta = 0) {
    const { previous } = this;
    const { matches, scores } = previous;
    const addressLeft = address.substr(0, address.length - match.length);
    const _ = new Matches(addressLeft);

    if (entity.status) {
      const goodEntity = getEntityById(entity.id);
      if (goodEntity) entity = goodEntity;
    }
    _.entity = entity;

    _.matches = [...matches, match];
    _.scores = [
      ...scores,
      match.length * scorePerChar,
      scoreDelta +
        (entity.parent != previous.entity ? scoreDeltaSkip * entity.level : 0)
    ];

    return _;
  }
}

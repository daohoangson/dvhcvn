import Entity, { delims } from "./entity";
import { deaccent, normalize } from "./vietnamese";

const scorePerChar = 10;
const scoreDeltaSkip = -5;
const scoreDeltaInitials = -2;
const scoreDeltaName2 = -1;

type Match = {
  id: string;
  level: number;
  name: string | number;
  parentId: string;
  type: string;

  address: string;
  match: string;
  scoreDelta: number;
};

const newMatch = (
  entity: Entity,
  address: string,
  match: string,
  scoreDelta: number
): Match => ({
  id: entity.id,
  level: entity.level,
  name: entity.name,
  parentId: entity.parent ? entity.parent.id : null,
  type: entity.type,

  address: address,
  match: match,
  scoreDelta: scoreDelta
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
    let delta = 0;
    this.matches.forEach(m => {
      matched += m.match;
      delta += m.scoreDelta;
    });
    return matched.length * scorePerChar + delta;
  }

  slice(parents: Matches, skippedEntity: Entity = null) {
    if (this.matches.length <= parents.matches.length) return;

    const slice = this.matches.slice(parents.matches.length);
    const matches = skippedEntity
      ? [newMatch(skippedEntity, "", "", scoreDeltaSkip), ...slice]
      : slice;
    return new Matches(matches);
  }

  withMatch = (
    entity: Entity,
    address: string,
    match: string,
    scoreDelta: number
  ) =>
    new Matches([
      ...this.matches,
      newMatch(entity, address, match, scoreDelta)
    ]);

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
    const { initials, names, names2, regExp } = entity.prepare();

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
    if (nameFound) return parents.withMatch(entity, address, match, 0);

    const initialsFound = initials.reduce((prev, i) => {
      if (prev && prev.length > i.length) return prev;
      if (match.indexOf(i) > -1) return i;
      return prev;
    }, null);
    if (initialsFound)
      return parents.withMatch(entity, address, match, scoreDeltaInitials);

    const match2 = address2.substr(address2.length - length);
    const name2Found = names2.reduce((prev, n) => {
      if (prev && prev.length > n.length) return prev;
      if (match2.indexOf(n) > -1) return n;
      return prev;
    }, null);
    if (name2Found)
      return parents.withMatch(entity, address, match2, scoreDeltaName2);

    return null;
  }

  update(resolved: Matches, skippedEntity: Entity = null) {
    const matches = resolved.slice(this.parents, skippedEntity);
    if (!matches) return;

    const score = matches.score();
    const self = { matches, score };

    if (typeof this.count[score] === "number") {
      const thisParentId = matches.last().parentId;
      const otherParentId = this.histories[score]
        ? this.histories[score].matches.last().parentId
        : null;
      if (otherParentId && thisParentId === otherParentId) {
        // special case: one parent has more than one entity
        // with the same name -> keep the first one that matched
      } else {
        this.count[score]++;
        delete this.histories[score];
      }
    } else {
      this.count[score] = 1;
      this.histories[score] = self;
    }
  }
}

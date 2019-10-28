import Entity from "./entity";
import Matcher, { Matches } from "./matcher";

const numberRegExp = new RegExp("[0-9]{4,}", "g");
const spaceRegExp = new RegExp("\\s{2,}", "g");
const alternateRegExp1Parentheses = new RegExp("\\([^)]+\\)$");
const alternateRegExp2Slash = new RegExp("/[^/]+$");
const alternateRegExp3Dash = new RegExp("-[^-]+$");

type ParserOptions = {
  debug?: boolean;
};

export default class Parser {
  private debug = false;
  private entities: Entity[];

  constructor(options?: ParserOptions) {
    // eslint-disable-next-line
    const sorted = require("../../../history/data/tree");
    this.entities = [new Entity("root", [["Nước Việt Nam"], sorted, ""])];

    if (options) {
      this.debug = !!options.debug;
    }
  }

  parse(address: string) {
    address = address.replace(numberRegExp, "");
    address = address.replace(spaceRegExp, " ");

    const nada = new Matches(address);
    const matcher = new Matcher(address, nada);
    matcher.update(this.resolve(address, this.entities, nada));

    const resolveAlternate = (regExp: RegExp) => {
      const alternate = address.replace(regExp, "");
      if (alternate === address) return;
      matcher.update(this.resolve(alternate, this.entities, nada));
    };
    resolveAlternate(alternateRegExp1Parentheses);
    resolveAlternate(alternateRegExp2Slash);
    resolveAlternate(alternateRegExp3Dash);

    const best = matcher.best();
    return best ? best.results() : [];
  }

  private log(...args: any[]) {
    if (!this.debug) return;
    console.log(...args.map(v => (v && v.describe ? v.describe() : v)));
  }

  private resolve(
    input: string | Matcher,
    entities: Entity[],
    matches: Matches
  ) {
    const matcher =
      typeof input === "string" ? new Matcher(input, matches) : input;
    const { id } = matcher;

    let before = matcher.best();
    entities.forEach(e => {
      const current = matcher.try(e);
      if (!current) return;
      this.log("resolve[%d]: matched", id, entities[0].parent, current);

      let resolved = e.hasChildren()
        ? this.resolve(current.address, e.children(), current)
        : current;

      if (resolved === current && e.level === 1) {
        const dedupMatcher = new Matcher(current.address, current);
        const dedup = dedupMatcher.try(e);
        if (dedup) {
          resolved = this.resolve(dedup.address, e.children(), current);
        }
      }

      matcher.update(resolved);
      const best = matcher.best();
      if (best !== before) this.log("resolve[%d]: new best", id, e, best);
      before = best;
    });

    matcher.update(this.skipOneLevel(matcher.address, entities, matches));

    const b = matcher.best();
    if (!b) return before || matches;
    if (b !== before && b !== matches)
      this.log("next[%d]: skipped", id, b.entity.parent, b);
    return b;
  }

  private skipOneLevel(address: string, entities: Entity[], matches: Matches) {
    const matcher = new Matcher(address, matches);
    const { id } = matcher;
    const parent = matches.entity ? matches.entity : null;
    const level = parent ? parent.level : -1;

    entities.forEach(e => {
      // do not skip too far from the last parent
      if (e.level > level + 2) return;
      if (!e.hasChildren()) return;

      const before = matcher.best();
      this.resolve(matcher, e.children(), matches);

      const b = matcher.best();
      if (b !== before) this.log("skipOneLevel[%d]: new best", id, e.parent, b);
    });

    return matcher.best() || matches;
  }
}

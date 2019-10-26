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
    this.entities = [new Entity("root", [["Nước Việt Nam"], sorted])];

    if (options) {
      this.debug = !!options.debug;
    }
  }

  parse(address: string) {
    address = address.replace(numberRegExp, "");
    address = address.replace(spaceRegExp, " ");

    const nada = new Matches();
    const matcher = new Matcher(address, nada);
    matcher.update(this.next(address, this.entities, nada));

    const resolveAlternate = (regExp: RegExp) => {
      const alt = address.replace(regExp, "");
      if (alt === address) return;
      matcher.update(this.next(alt, this.entities, nada));
    };
    resolveAlternate(alternateRegExp1Parentheses);
    resolveAlternate(alternateRegExp2Slash);
    resolveAlternate(alternateRegExp3Dash);

    const best = matcher.best();
    return best ? best.results() : [];
  }

  private log(message: string, ...args) {
    if (!this.debug) return;
    console.log.apply(console, [message, ...args]);
  }

  private next(address: string, entities: Entity[], parents: Matches) {
    const matcher = new Matcher(address, parents);
    const { id } = matcher;

    let before = matcher.best();
    entities.forEach(e => {
      const current = matcher.try(e);
      if (!current) return;
      this.log("next[%d] ->", id, current.last());

      let resolved = e.hasChildren()
        ? this.next(current.address(), e.children(), current)
        : current;

      if (resolved === current && e.level === 1) {
        const dedupMatcher = new Matcher(current.address(), current);
        const dedup = dedupMatcher.try(e);
        if (dedup) {
          resolved = this.next(dedup.address(), e.children(), current);
        }
      }

      matcher.update(resolved);
      const best = matcher.best();
      if (best === before) {
        this.log("next[%d]: no change", id);
      } else {
        this.log("next[%d]: best=", id, best);
      }
      before = best;
    });

    matcher.update(this.skipOneLevel(address, entities, parents));

    const after = matcher.best();
    if (!after) return before ? parents.with(before) : parents;
    if (after !== before) this.log("next[%d]: after=", id, after);
    return parents.with(after);
  }

  private skipOneLevel(address: string, entities: Entity[], parents: Matches) {
    const matcher = new Matcher(address, parents);
    const { id } = matcher;
    const parent = parents.last();
    const level = parent ? parent.level : -1;

    entities.forEach(e => {
      // do not skip too far from the last parent
      if (e.level > level + 2) return;
      if (!e.hasChildren()) return;

      const before = matcher.best();
      matcher.update(this.next(address, e.children(), parents), e);

      const after = matcher.best();
      if (after !== before) this.log("skipOneLevel[%d]: best=", id, after);
    });

    const best = matcher.best();
    return best ? parents.with(best) : parents;
  }
}

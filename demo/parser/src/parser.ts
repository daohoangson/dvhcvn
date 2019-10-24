import Entity from "./entity";
import Matcher, { Matches } from "./matcher";

const numberRegExp = new RegExp("[0-9]{4,}", "g");
const alternateRegExp1Parentheses = new RegExp("\\([^)]+\\)$");
const alternateRegExp2Slash = new RegExp("/[^/]+$");
const alternateRegExp3Dash = new RegExp("-[^-]+$");
const alternateRegExp4Comma = new RegExp(",[^,]+$");

type ParserOptions = {
  debug?: boolean;
};

export default class Parser {
  private debug = false;
  private entities: Entity[];

  constructor(options?: ParserOptions) {
    const sorted = require("../../../data/sorted") as any[];
    this.entities = [new Entity([null, "Việt Nam", null, null, sorted])];

    if (options) {
      this.debug = !!options.debug;
    }
  }

  parse(address: string) {
    // ignore email address
    if (address.indexOf("@") > -1) return [];

    // remove phone number, post code, etc.
    address = address.replace(numberRegExp, "");

    const nada = new Matches();
    const matcher = new Matcher(address, nada);
    matcher.update(this.next(address, this.entities, nada));

    const resolveAlternate = (regExp: RegExp) => {
      const alt = address.replace(regExp, "");
      if (alt === address) return;
      matcher.update(this.next(alt, this.entities, nada));
    }
    resolveAlternate(alternateRegExp1Parentheses);
    resolveAlternate(alternateRegExp2Slash);
    resolveAlternate(alternateRegExp3Dash);
    resolveAlternate(alternateRegExp4Comma);

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
          resolved = this.next(dedup.address(), e.children(), dedup);
        }
      }

      return matcher.update(resolved);
    });

    const before = matcher.best();
    if (before) this.log("next[%d]: before=", id, before);
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

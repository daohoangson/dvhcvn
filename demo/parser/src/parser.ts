import Entity from "./entity";
import Matcher, { Match, tryToMatch } from "./matcher";

type ParserOptions = {
  debug?: boolean;
};

export default class Parser {
  private debug = false;
  private root: Entity;
  private resolveCount = 0;

  constructor(options?: ParserOptions) {
    const sorted = require("../../../data/sorted") as any[];
    this.root = new Entity([
      undefined,
      "Việt Nam",
      undefined,
      undefined,
      sorted
    ]);

    if (options) {
      this.debug = !!options.debug;
    }
  }

  parse(address: string) {
    // ignore email address
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
    candidates: Entity[],
    parents: Match[]
  ): Match[] {
    address = address.replace(/[ .,-]+$/, "");

    const options = new Matcher(this.resolveCount++);
    candidates.forEach(candidate => {
      const match = tryToMatch(address, candidate);
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

  private resolveSkipping(address: string, skips: Entity[], parents: Match[]) {
    const lastParent = parents.length > 0 ? parents[parents.length - 1] : null;
    const lastLevel = lastParent ? lastParent.level : -1;

    const options = new Matcher(this.resolveCount++);
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
}

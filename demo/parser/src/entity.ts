import unidecode from "unidecode";

import { getAsciiAccent, getInitials } from "./vietnamese";

const typeTranslations = {
  tinh: ["province"],
  "thanh pho": ["city"],
  quan: ["district", "dist"],
  phuong: ["ward"]
};

export default class Entity {
  id: string | undefined;
  level: number;
  name: string | number;
  type: string | undefined;

  private regExp: RegExp | undefined;
  private expectedMatches: string[] | undefined;

  private _children: Entity[] | undefined;

  constructor(json: any, level = 0) {
    const [id, name, type, _, children] = json;
    this.id = id;

    this.level = level;

    if (typeof name !== "string") throw Error("Invalid name in json: " + name);
    this.name = name.match(/^[0-9]+$/) ? parseInt(name) : name;

    this.type = type;

    this._children = children
      ? (json[4] as any[]).map(j => new Entity(j, level + 1))
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

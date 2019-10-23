import unidecode from "unidecode";

import { initials, normalize } from "./vietnamese";

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
  private names: string[] | undefined;

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
    if (this.regExp !== undefined && this.names !== undefined)
      return {
        names: this.names,
        regExp: this.regExp
      };

    const name = (unidecode(`${this.name}`) as string).toLowerCase();
    const type =
      this.type !== undefined
        ? (unidecode(this.type) as string).toLowerCase()
        : undefined;
    const typeInitialGlue = "[. ]*";

    this.names = [];
    const patterns: string[] = [];
    let nameInitials: string | undefined;

    if (typeof this.name === "number") {
      this.names.push(name.toString());
    } else {
      patterns.push(name);
      this.names.push(name.toLowerCase());
      this.names.push(normalize(this.name));

      if (name.indexOf(" ") > -1) {
        nameInitials = initials(name);
        patterns.push(nameInitials);
        this.names.push(normalize(initials(this.name)));
      }

      const nameWithoutSpace = name.replace(/\s/g, "");
      if (nameWithoutSpace !== name) {
        patterns.push(nameWithoutSpace);
        patterns.push(`${type} ${nameWithoutSpace}`);

        this.names.push(normalize(this.name.replace(/\s/g, "")));
        this.names.push(nameWithoutSpace.toLowerCase());
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
            patterns.push(initials(nameWithType2));
          }
        });
      }

      const typeInitials = [initials(type)];
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

    return { regExp: this.regExp, names: this.names };
  }
}

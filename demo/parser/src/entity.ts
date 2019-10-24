import { deaccent, initials, normalize } from "./vietnamese";

export const delims = "[ _.,-]+";
const typeGlue = "[ .:]*";

const typeTranslations: { [key: string]: string[] } = {
  tinh: ["province"],
  "thanh pho": ["city"],
  quan: ["district", "dist"],
  huyen: ["district", "dist"],
  phuong: ["ward"]
};

export default class Entity {
  id: string;
  level: number;
  name: string | number;
  parent: Entity;
  type: string;

  private regExp: RegExp;
  private names: string[];
  private names2: string[];
  private initials: string[];

  private _children: Entity[];

  constructor(json: any, parent: Entity = null) {
    const [id, name, type, _, children] = json;
    this.id = id;
    this.level = parent ? parent.level + 1 : 0;
    this.parent = parent;
    this.type = type;

    if (typeof name !== "string") throw Error("Invalid name in json: " + name);
    this.name = name.match(/^[0-9]+$/) ? parseInt(name) : name.trim();

    this._children = children
      ? (children as any[]).map(j => new Entity(j, this))
      : null;
  }

  children() {
    return this._children || [];
  }

  hasChildren() {
    return this._children && this._children.length > 0;
  }

  prepare() {
    if (this.regExp)
      return {
        initials: this.initials,
        names: this.names,
        names2: this.names2,
        regExp: this.regExp
      };

    const name2 = deaccent(this.name.toString());
    const type = this.type ? deaccent(this.type) : null;

    this.initials = [];
    this.names = [];
    this.names2 = [];
    const patterns: string[] = [];
    let nameInitials2: string;
    let namePattern: string;

    if (typeof this.name === "number") {
      namePattern = `0*${this.name}`;
      this.names.push(this.name.toString());
    } else {
      namePattern = name2;
      patterns.push(namePattern);
      const nameNormalized = normalize(this.name);
      this.names.push(nameNormalized);
      this.names2.push(name2.toLowerCase());

      if (this.level < 3 && this.name.indexOf(" ") > -1) {
        // special case: name initials for level 1+2
        // Hà Nội -> HN
        // Hồ Chí Minh -> HCM
        const nameInitials = initials(this.name);
        nameInitials2 = deaccent(nameInitials);
        patterns.push("\\s" + nameInitials2);

        this.initials.push(nameInitials);
        this.initials.push(nameInitials.toLowerCase());

        const nameInitials2Uppercase = nameInitials2.toUpperCase();
        if (nameInitials2Uppercase !== nameInitials) {
          this.initials.push(nameInitials2);
          this.initials.push(nameInitials2Uppercase);
        }
      }

      const name2WithoutSpace = name2.replace(/\s/g, "");
      if (name2WithoutSpace !== name2) {
        patterns.push(name2WithoutSpace);
        if (type) {
          patterns.push(`${type} ${name2WithoutSpace}`);
        }

        this.names.push(nameNormalized.replace(/\s/g, ""));
        this.names2.push(name2WithoutSpace);
      }
    }

    if (type) {
      patterns.push(`${type}${typeGlue}${namePattern}`);

      if (typeof typeTranslations[type] !== "undefined") {
        typeTranslations[type].forEach(translation => {
          patterns.push(`${translation}${typeGlue}${namePattern}`);

          patterns.push(`${namePattern}${typeGlue}${translation}`);

          if (nameInitials2)
            patterns.push("\\s" + initials(`${namePattern} ${translation}`));
        });
      }

      const typeInitials = [initials(type)];
      if (typeInitials[0] === "p") {
        // special case: phường -> "p" or "f"
        typeInitials.push("f");
      }
      typeInitials.forEach(typeInitial => {
        patterns.push(`${typeInitial}${typeGlue}${namePattern}`);

        if (nameInitials2) {
          patterns.push(`${typeInitial}${typeGlue}${nameInitials2}`);
        }
      });
    }

    this.regExp = new RegExp(
      (patterns.length > 1 ? `(${patterns.join("|")})` : patterns[0]) + "$"
    );

    return {
      initials: this.initials,
      names: this.names,
      names2: this.names2,
      regExp: this.regExp
    };
  }
}

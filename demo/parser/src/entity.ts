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
  name2: string;
  type: string;

  private regExp: RegExp;
  private names: string[];

  private _children: Entity[];

  constructor(json: any, level = 0) {
    const [id, name, type, _, children] = json;
    this.id = id;

    this.level = level;

    if (typeof name !== "string") throw Error("Invalid name in json: " + name);
    this.name = name.match(/^[0-9]+$/) ? parseInt(name) : name.trim();
    this.name2 = typeof this.name === "string" ? deaccent(this.name) : null;

    this.type = type;

    this._children = children
      ? (children as any[]).map(j => new Entity(j, level + 1))
      : null;
  }

  children() {
    return this._children || [];
  }

  hasChildren() {
    return this._children && this._children.length > 0;
  }

  prepare() {
    if (this.regExp && this.names)
      return {
        names: this.names,
        regExp: this.regExp
      };

    const name = deaccent(this.name.toString());
    const type = this.type ? deaccent(this.type) : null;

    this.names = [];
    const patterns: string[] = [];
    let nameInitials: string;
    let namePattern: string;

    if (typeof this.name === "number") {
      namePattern = '0*' + name.toString();
      this.names.push(name.toString());
    } else {
      namePattern = name;
      patterns.push(namePattern);
      this.names.push(name.toLowerCase());

      const nameNormalized = normalize(this.name);
      this.names.push(nameNormalized);

      if (this.level < 3 && name.indexOf(" ") > -1) {
        // special case: name initials for level 1+2
        // Hà Nội -> HN
        // Hồ Chí Minh -> HCM
        nameInitials = initials(name);
        patterns.push('\\s' + nameInitials);
        this.names.push(nameInitials);
        this.names.push(normalize(initials(this.name)));
      }

      const nameWithoutSpace = name.replace(/\s/g, "");
      if (nameWithoutSpace !== name) {
        patterns.push(nameWithoutSpace);
        if (type) {
          patterns.push(`${type} ${nameWithoutSpace}`);
        }

        this.names.push(nameWithoutSpace);
        this.names.push(nameNormalized.replace(/\s/g, ""));
      }
    }

    if (type) {
      patterns.push(`${type}${typeGlue}${namePattern}`);

      if (typeof typeTranslations[type] !== "undefined") {
        typeTranslations[type].forEach(translation => {
          patterns.push(`${translation}${typeGlue}${namePattern}`);

          const nameWithTranslation = `${namePattern}${typeGlue}${translation}`;
          patterns.push(nameWithTranslation);

          if (nameInitials) {
            patterns.push('\\s' + initials(nameWithTranslation));
          }
        });
      }

      const typeInitials = [initials(type)];
      if (typeInitials[0] === "p") {
        // special case: phường -> "p" or "f"
        typeInitials.push("f");
      }
      typeInitials.forEach(typeInitial => {
        patterns.push(`${typeInitial}${typeGlue}${namePattern}`);

        if (nameInitials) {
          patterns.push(`${typeInitial}${typeGlue}${nameInitials}`);
        }
      });
    }

    this.regExp = new RegExp((patterns.length > 1 ? `(${patterns.join("|")})` : patterns[0]) + "$");

    return { regExp: this.regExp, names: this.names };
  }
}

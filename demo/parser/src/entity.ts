import { deaccent, initials, normalize } from "./vietnamese";

const entitiesById: { [id: string]: Entity[] } = {};

export const getEntityById = (id: string) =>
  entitiesById[id]
    ? entitiesById[id].reduce((p, e) => (p ? p : e.status ? p : e), null)
    : null;

const nameNumericRegExp = new RegExp("^[0-9]+$");

const romanNumbers = [
  "",
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
  "x"
];

const typeGlue = "[ .:]*";

const typeTranslations: { [key: string]: string[] } = {
  tinh: ["province"],
  "thanh pho": ["city"],
  quan: ["district", "dist"],
  huyen: ["district", "dist"],
  phuong: ["ward"]
};

const types: string[][] = [
  ["Nước"],
  ["Tỉnh", "Thành phố"],
  ["Quận", "Huyện", "Thành phố", "Thị xã"],
  ["Phường", "Thị trấn", "Xã"]
];

const typeRegExp = new RegExp(
  "^(" + types.map(ts => ts.join("|")).join("|") + ")\\s+(.+)$",
  "i"
);

type EntityJson = [string[], { [key: string]: EntityJson }, string];

export default class Entity {
  id: string;
  level: number;
  name: string | number;
  parent: Entity;
  status: "Deleted" | "Moved" | undefined;
  type: string;

  private fullNames: string[];
  private initials: string[];
  private names: string[];
  private names2: string[];
  private regExp: RegExp;
  private typePatterns: string[];

  private _children: Entity[];

  constructor(id: string, json: EntityJson, parent: Entity = null) {
    this.id = id;
    this.level = parent ? parent.level + 1 : 0;
    this.parent = parent;

    const [fullNames, children, status] = json;
    this.fullNames = fullNames;

    this._children = children
      ? Object.entries(children).map(([i, j]) => new Entity(i, j, this))
      : null;

    switch (status) {
      case "Deleted":
      case "Moved":
        this.status = status;
    }

    entitiesById[this.id] = entitiesById[this.id] || [];
    entitiesById[this.id].push(this);
  }

  children() {
    return this._children || [];
  }

  describe() {
    const { id, name, parent } = this;
    if (!name) this.prepare();

    const parentStr =
      parent && parent.id !== "root" ? ` ${parent.describe()}` : "";
    return `#${id} ${name}${parentStr}`;
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
        regExp: this.regExp,
        typePatterns: this.typePatterns
      };

    this.initials = [];
    this.names = [];
    this.names2 = [];
    this.typePatterns = [];
    const patterns = this.fullNames
      .reverse()
      .reduce((p, n) => [...p, ...this.p(n)], []);
    if (patterns.length === 0) {
      console.error("Cannot prepare Entity", this);
      return {};
    }

    this.regExp = new RegExp(`(?<=([^a-z]|^))(${patterns.join("|")})$`);

    return {
      initials: this.initials,
      names: this.names,
      names2: this.names2,
      regExp: this.regExp,
      typePatterns: this.typePatterns
    };
  }

  private p(fullName: string) {
    const patterns: string[] = [];

    const m = fullName.match(typeRegExp);
    if (!m) {
      console.error("Cannot extract type from Entity full name: %s", fullName);
      return patterns;
    }

    const thisType = m[1];
    const thisName = m[2].match(nameNumericRegExp)
      ? parseInt(m[2])
      : m[2].trim();
    if (!this.type) this.type = thisType;
    if (!this.name) this.name = thisName;
    const name2 = deaccent(thisName.toString());

    let nameInitials2: string;
    const namePatterns: string[] = [];

    if (typeof thisName === "number") {
      namePatterns.push(`0*${thisName}`);
      this.names.push(thisName.toString());

      const romanNumber = romanNumbers[thisName];
      if (romanNumber) {
        namePatterns.push(romanNumber);
        this.names.push(romanNumber);
      }
    } else {
      namePatterns.push(name2);
      patterns.push(name2);
      const nameNormalized = normalize(thisName);
      this.names.push(nameNormalized);
      this.names2.push(name2);

      if (this.level < 3 && thisName.indexOf(" ") > -1) {
        // special case: name initials for level 1+2
        // Hà Nội -> HN
        // Hồ Chí Minh -> HCM
        const nameInitials = initials(thisName);
        nameInitials2 = deaccent(nameInitials);
        patterns.push(nameInitials2);

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
        this.names.push(nameNormalized.replace(/\s/g, ""));
        this.names2.push(name2WithoutSpace);
        namePatterns.push(name2WithoutSpace);
        patterns.push(name2WithoutSpace);
      }
    }

    const sameLevelTypePatterns: string[] = [];
    const sameLevelTypeRightPatterns: string[] = [];
    const thisType2 = deaccent(thisType);
    types[this.level].forEach(type => {
      const type2 = deaccent(type);
      const pushTypePattern = (t: string) => {
        sameLevelTypePatterns.push(t);
        if (type2 === thisType2) this.typePatterns.push(t);
      };
      pushTypePattern(type2);

      if (typeTranslations[type2]) {
        typeTranslations[type2].forEach(translation => {
          pushTypePattern(translation);
          sameLevelTypeRightPatterns.push(translation);

          if (nameInitials2) {
            // example: "hcmc"
            patterns.push(initials(`${name2} ${translation}`));
          }
        });
      }

      const typeInitials = [initials(type2)];
      if (typeInitials[0] === "p") {
        // special case: phường -> "p" or "f"
        typeInitials.push("f");
      }
      typeInitials.forEach(typeInitial => {
        pushTypePattern(typeInitial);

        if (nameInitials2) {
          // example: tp. hcm
          patterns.push(`${typeInitial}${typeGlue}${nameInitials2}`);
        }
      });
    });

    const namePattern = `(${namePatterns.join("|")})`;
    patterns.push(
      `(${sameLevelTypePatterns.join("|")})${typeGlue}${namePattern}`
    );
    if (sameLevelTypeRightPatterns.length > 0) {
      patterns.push(
        `${namePattern}${typeGlue}(${sameLevelTypeRightPatterns.join("|")})`
      );
    }

    return patterns;
  }
}

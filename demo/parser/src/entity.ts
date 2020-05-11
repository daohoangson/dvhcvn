import { deaccent, initials, normalize } from "./vietnamese";

export const delims = "[ _.,/–-]+";

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

const typeRegExp = new RegExp(
  "^(Huyện|Nước|Phường|Quận|Thành phố|Thị trấn|Thị xã|Tỉnh|Xã)\\s+(.+)$",
  "i"
);

const typos = Object.entries({
  i: "y",
  l: "n",
  s: "x"
}).map(typo => {
  const regExp0 = RegExp(typo[0], "g");
  const regExp1 = RegExp(typo[1], "g");

  return (names: string[], name: string, patterns: string[], name2: string) => {
    const typo01 = name.replace(regExp0, typo[1]);
    if (typo01 !== name) {
      names.push(typo01);
      patterns.push(name2.replace(regExp0, typo[1]));
    }

    const typo10 = name.replace(regExp1, typo[0]);
    if (typo10 !== name) {
      names.push(typo10);
      patterns.push(name2.replace(regExp1, typo[0]));
    }
  };
});

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
    if (!this.name) this.prepare();
    return `#${this.id} ${this.type} ${this.name}`;
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

    this.initials = [];
    this.names = [];
    this.names2 = [];
    const patterns = this.fullNames.reduce((p, n) => [...p, ...this.p(n)], []);
    if (patterns.length === 0) {
      console.error("Cannot prepare Entity", this);
      return {};
    }

    this.regExp = new RegExp(`(?<=([^a-z]|^))(${patterns.join("|")})$`);

    return {
      initials: this.initials,
      names: this.names,
      names2: this.names2,
      regExp: this.regExp
    };
  }

  private p(fullName: string) {
    const patterns: string[] = [];

    const m = fullName.match(typeRegExp);
    if (!m) {
      console.error("Cannot extract type from Entity full name: %s", fullName);
      return patterns;
    }

    this.type = m[1];
    this.name = m[2].match(nameNumericRegExp) ? parseInt(m[2]) : m[2].trim();
    const name2 = deaccent(this.name.toString());
    const type = deaccent(this.type);

    let nameInitials2: string;
    const namePatterns: string[] = [];

    if (typeof this.name === "number") {
      namePatterns.push(`0*${this.name}`);
      this.names.push(this.name.toString());

      const romanNumber = romanNumbers[this.name];
      if (romanNumber) {
        namePatterns.push(romanNumber);
        this.names.push(romanNumber);
      }
    } else {
      namePatterns.push(name2);
      patterns.push(name2);
      const nameNormalized = normalize(this.name);
      this.names.push(nameNormalized);
      this.names2.push(name2);

      const typoPatterns: string[] = []
      typos.forEach(f => f(this.names, nameNormalized, typoPatterns, name2));
      typoPatterns.forEach(p => {
        namePatterns.push(p);
        patterns.push(p);
      });

      if (this.level < 3 && this.name.indexOf(" ") > -1) {
        // special case: name initials for level 1+2
        // Hà Nội -> HN
        // Hồ Chí Minh -> HCM
        const nameInitials = initials(this.name);
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

    if (type) {
      const typePatterns: string[] = [type];
      const typeRightPatterns: string[] = [];

      if (typeTranslations[type]) {
        typeTranslations[type].forEach(translation => {
          typePatterns.push(translation);
          typeRightPatterns.push(translation);

          if (nameInitials2) {
            // example: "hcmc"
            patterns.push(initials(`${this.names2[0]} ${translation}`));
          }
        });
      }

      const typeInitials = [initials(type)];
      if (typeInitials[0] === "p") {
        // special case: phường -> "p" or "f"
        typeInitials.push("f");
      }
      typeInitials.forEach(typeInitial => {
        typePatterns.push(typeInitial);

        if (nameInitials2) {
          // example: tp. hcm
          patterns.push(`${typeInitial}${typeGlue}${nameInitials2}`);
        }
      });

      const namePattern = `(${namePatterns.join("|")})`;
      patterns.push(`(${typePatterns.join("|")})${typeGlue}${namePattern}`);
      if (typeRightPatterns.length > 0) {
        patterns.push(`${namePattern}${typeGlue}(${typeRightPatterns.join("|")})`);
      }
    }

    return patterns;
  }
}

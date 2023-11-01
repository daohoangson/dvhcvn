import { level1s, parents } from "./data";
import { findLevelXById, findLevelXByName } from "./internal";
import { Level1, Level2, Level3 } from "./model";

export function findById(id: string): Level1 | Level2 | Level3 | undefined {
  switch (id.length) {
    case 5:
      const level2Id = parents[id];
      if (typeof level2Id === "string") {
        const level1Id = parents[level2Id];
        if (typeof level1Id === "string") {
          return findLevel1ById(level1Id)
            ?.findLevel2ById(level2Id)
            ?.findLevel3ById(id);
        }
      }
      break;
    case 3:
      const level1Id = parents[id];
      if (typeof level1Id === "string") {
        return findLevel1ById(level1Id)?.findLevel2ById(id);
      }
      break;
  }

  return findLevel1ById(id);
}

export function findLevel1ById(id: string): Level1 | undefined {
  return findLevelXById<Level1>(level1s, id);
}

export function findLevel1ByName(name: string): Level1 | undefined {
  return findLevelXByName<Level1>(level1s, name);
}

export * from "./data";
export * from "./model";

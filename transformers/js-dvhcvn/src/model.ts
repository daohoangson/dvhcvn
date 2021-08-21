import { level1s } from './data'
import { Entity, findById, findByName } from './internal'

export class Level1 extends Entity<undefined, Level2> {
  public get parent (): undefined {
    return undefined
  }

  public findLevel2ById (id: string): Level2 | undefined {
    return findById<Level2>(this.children, id)
  }

  public findLevel2ByName (name: string): Level2 | undefined {
    return findByName<Level2>(this.children, name)
  }
}

export class Level2 extends Entity<Level1, Level3> {
  constructor (
    private readonly _level1Index: number,
    id: string,
    name: string,
    type: Type,
    children: Level3[]) {
    super(id, name, type, children)
  }

  public get parent (): Level1 {
    return level1s[this._level1Index]
  }

  public findLevel3ById (id: string): Level3 | undefined {
    return findById<Level3>(this.children, id)
  }

  public findLevel3ByName (name: string): Level3 | undefined {
    return findByName<Level3>(this.children, name)
  }
}

export class Level3 extends Entity<Level2, undefined> {
  constructor (
    private readonly _level1Index: number,
    private readonly _level2Index: number,
    id: string,
    name: string,
    type: Type
  ) {
    super(id, name, type)
  }

  public get parent (): Level2 {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return level1s[this._level1Index].children![this._level2Index]
  }
}

export enum Type {
  huyen,
  quan,
  phuong,
  thi_tran,
  thi_xa,
  tinh,
  tp,
  tptw,
  xa,
}

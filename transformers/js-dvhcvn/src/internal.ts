import { Type } from './model'

export abstract class Entity<ParentType extends Entity<any, any> | undefined, ChildType extends Entity<any, any> | undefined> {
  public abstract get parent (): ParentType

  constructor (
    public id: string,
    public name: string,
    public type: Type,
    public children?: ChildType[]
  ) { }

  public get typeAsString (): string {
    switch (this.type) {
      case Type.huyen:
        return 'Huyện'
      case Type.quan:
        return 'Quận'
      case Type.phuong:
        return 'Phường'
      case Type.thi_tran:
        return 'Thị trấn'
      case Type.thi_xa:
        return 'Thị xã'
      case Type.tinh:
        return 'Tỉnh'
      case Type.tp:
        return 'Thành phố'
      case Type.tptw:
        return 'Thành phố trực thuộc Trung ương'
      case Type.xa:
        return 'Xã'
    }
  }

  public toString (): string {
    return this.parent != null ? `${this.parent.toString()} > ${this.name}` : this.name
  }
}

export function findById<T extends Entity<any, any>> (list: T[] | undefined, id: string): T | undefined {
  for (const item of (list ?? [])) {
    if (item.id === id) {
      return item
    }
  }
}

export function findByName<T extends Entity<any, any>> (list: T[] | undefined, name: string): T | undefined {
  for (const item of (list ?? [])) {
    if (item.name === name) {
      return item
    }
  }
}

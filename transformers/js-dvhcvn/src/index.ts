import { level1s } from './data'
import { findById, findByName } from './internal'
import { Level1 } from './model'

export function findLevel1ById (id: string): Level1 | undefined {
  return findById<Level1>(level1s, id)
}

export function findLevel1ByName (name: string): Level1 | undefined {
  return findByName<Level1>(level1s, name)
}

export * from './data'
export * from './model'

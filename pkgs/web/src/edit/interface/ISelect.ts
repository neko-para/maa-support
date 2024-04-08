import { NodeInterface } from 'baklavajs'
import { markRaw } from 'vue'

import ISelectComp from './ISelectComp.vue'

export class ISelectInterface<KeySet extends string> extends NodeInterface<KeySet | undefined> {
  options: KeySet[]
  defaultValue: KeySet

  constructor(name: string, def: KeySet, vals: KeySet[]) {
    super(name, undefined)
    this.setComponent(markRaw(ISelectComp<KeySet>))
    this.setPort(false)

    this.options = vals
    this.defaultValue = def
  }
}

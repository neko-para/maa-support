import { NodeInterface } from 'baklavajs'
import { markRaw } from 'vue'

import type { Rect } from '../../types'
import IRectComp from './IRectComp.vue'

export class IRectInterface extends NodeInterface<Rect | undefined> {
  constructor(name: string) {
    super(name, undefined)
    this.setComponent(markRaw(IRectComp))
    this.setPort(false)
  }
}

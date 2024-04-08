import { NodeInterface, NodeInterfaceType, setType } from 'baklavajs'
import { markRaw } from 'vue'

import ICheckComp from './ICheckComp.vue'

export class ICheckInterface extends NodeInterface<boolean | undefined> {
  constructor(name: string) {
    super(name, undefined)
    this.setComponent(markRaw(ICheckComp))
    this.setPort(false)
  }
}

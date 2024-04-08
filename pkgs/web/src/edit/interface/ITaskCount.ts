import { NodeInterface, NodeInterfaceType, setType } from 'baklavajs'
import { markRaw } from 'vue'

import ITaskCountComp from './ITaskCountComp.vue'

export class ITaskCountInterface extends NodeInterface<number> {
  constructor(name: string) {
    super(name, 0)
    this.setComponent(markRaw(ITaskCountComp))
    this.setPort(false)
  }
}

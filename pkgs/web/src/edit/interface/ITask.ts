import { NodeInterface, NodeInterfaceType, setType } from 'baklavajs'
import { markRaw } from 'vue'

import ITaskComp from './ITaskComp.vue'

export class ITaskInterface extends NodeInterface<string> {
  constructor(name: string) {
    super(name, '')
    this.setComponent(markRaw(ITaskComp))
  }
}

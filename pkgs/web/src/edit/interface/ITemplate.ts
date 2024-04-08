import { NodeInterface, NodeInterfaceType, setType } from 'baklavajs'
import { markRaw } from 'vue'

import ITemplateComp from './ITemplateComp.vue'

export class ITemplateInterface extends NodeInterface<undefined | string[]> {
  constructor(name: string) {
    super(name, undefined)
    this.setComponent(markRaw(ITemplateComp))
    this.setPort(false)
  }
}

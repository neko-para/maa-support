import {
  defineDynamicNode,
  SelectInterface,
  type DynamicNodeUpdateResult,
  NodeInterface,
  NumberInterface
} from 'baklavajs'
import { ISelectInterface } from './interface/ISelect'
import { IRectInterface } from './interface/IRect'
import { ITaskInterface } from './interface/ITask'
import { ITaskCountInterface } from './interface/ITaskCount'
import { ITemplateInterface } from './interface/ITemplate'
import { ICheckInterface } from './interface/ICheck'

export const TaskNode = defineDynamicNode({
  type: 'TaskNode',
  inputs: {
    recognition: () =>
      new ISelectInterface<'DirectHit' | 'TemplateMatch'>('recognition', 'DirectHit', [
        'DirectHit',
        'TemplateMatch'
      ]),
    entry: () => new ITaskInterface('entry'),
    is_sub: () => new ICheckInterface('is_sub'),
    enabled: () => new ICheckInterface('enabled'),
    inverse: () => new ICheckInterface('inverse')
  },
  outputs: {
    nextCount: () => new ITaskCountInterface('nextCount').setPort(false)
  },
  onUpdate(inputs, outputs) {
    const result: DynamicNodeUpdateResult = {}

    result.inputs = {}
    result.outputs = {}
    result.forceUpdateOutputs = []

    switch (inputs.recognition) {
      case 'DirectHit':
        break
      case 'TemplateMatch':
        Object.assign(result.inputs, {
          roi: () => new IRectInterface('roi'),
          template: () => new ITemplateInterface('template')
        })
    }

    for (let i = 0; i < outputs.nextCount; i++) {
      const key = `next#${i}`
      result.outputs[key] = () => new ITaskInterface(key)
    }
    return result
  },

  onCreate(this: any) {
    this.width = 600
    this.twoColumn = true
  }
})

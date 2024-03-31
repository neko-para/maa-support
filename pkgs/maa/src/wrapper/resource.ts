import { api } from '@maa/schema'

import type { Status } from '../types'
import { __Disposable } from '../utils/dispose'
import type { TrivialCallback } from './callback'

export type ResourceId = string & { __kind: 'MaaResourceAPI' }
export type ResourceActionId = number & { __kind: 'MaaResourceActionId' }

class ResourceActionHolder {
  _res: ResourceId
  _id: ResourceActionId

  constructor(ctrl: ResourceId, id: ResourceActionId) {
    this._res = ctrl
    this._id = id
  }

  async status() {
    return (await api.MaaResourceStatus({ res: this._res, id: this._id })).return as Status
  }

  async wait() {
    return (await api.MaaResourceWait({ res: this._res, id: this._id })).return as Status
  }
}

export class Resource extends __Disposable {
  _res: ResourceId | null = null

  async create(callback: TrivialCallback) {
    this.defer(callback)
    this._res = (await api.MaaResourceCreate({ callback: callback._cb! })).return as ResourceId
    return !!this._res
  }

  async dispose() {
    if (this._res) {
      await api.MaaResourceDestroy({ res: this._res })
      this._res = null
    }
  }

  async postPath(path: string) {
    const id = (await api.MaaResourcePostPath({ res: this._res!, path })).return as ResourceActionId
    return new ResourceActionHolder(this._res!, id)
  }

  async loaded() {
    return (await api.MaaResourceLoaded({ res: this._res! })).return > 0
  }

  async clear() {
    return (await api.MaaResourceClear({ res: this._res! })).return > 0
  }

  async hash() {
    const ret = await api.MaaResourceGetHash({ res: this._res! })
    return ret.return > 0 ? ret.buffer : null
  }

  async taskList() {
    const ret = await api.MaaResourceGetTaskList({ res: this._res! })
    return ret.return > 0 ? (JSON.parse(ret.buffer) as string[]) : null
  }
}

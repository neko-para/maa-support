import { api } from '@maa/schema'

import type { Status } from '../types'
import type { __Disposable } from '../utils/dispose'
import type { CustomActionRunCallback, CustomActionStopCallback, TrivialCallback } from './callback'
import type { Controller } from './controller'
import type { Resource } from './resource'

export type InstanceId = string & { __kind: 'MaaInstanceAPI' }
export type InstanceTaskId = number & { __kind: 'InstanceTaskId' }

class InstanceTaskHolder {
  _inst: InstanceId
  _id: InstanceTaskId

  constructor(ctrl: InstanceId, id: InstanceTaskId) {
    this._inst = ctrl
    this._id = id
  }

  async setParam(param: string | Record<string, unknown>) {
    if (typeof param !== 'string') {
      param = JSON.stringify(param)
    }
    return (await api.MaaSetTaskParam({ inst: this._inst, id: this._id, param })).return > 0
  }

  async status() {
    return (await api.MaaTaskStatus({ inst: this._inst, id: this._id })).return as Status
  }

  async wait() {
    return (await api.MaaWaitTask({ inst: this._inst, id: this._id })).return as Status
  }
}

export class Instance implements __Disposable {
  _inst: InstanceId | null = null
  _cb: TrivialCallback | null = null

  async create(callback: TrivialCallback) {
    this._cb = callback
    this._inst = (await api.MaaCreate({ callback: this._cb._cb! })).return as InstanceId
    return !!this._inst
  }

  async dispose() {
    if (this._inst) {
      await api.MaaDestroy({ inst: this._inst })
      this._inst = null
    }
    await this._cb?.dispose()
  }

  async destroy() {
    await this.dispose()
  }

  async bindCtrl(ctrl: Controller) {
    return (await api.MaaBindController({ inst: this._inst!, ctrl: ctrl._ctrl! })).return > 0
  }

  async bindRes(res: Resource) {
    return (await api.MaaBindResource({ inst: this._inst!, res: res._res! })).return > 0
  }

  async postTask(entry: string, param: string | Record<string, unknown>) {
    if (typeof param !== 'string') {
      param = JSON.stringify(param)
    }
    const id = (await api.MaaPostTask({ inst: this._inst!, entry, param })).return as InstanceTaskId
    return new InstanceTaskHolder(this._inst!, id)
  }

  async postStop() {
    return (await api.MaaPostStop({ inst: this._inst! })).return > 0
  }

  async registerCustomAction(
    name: string,
    run: CustomActionRunCallback,
    stop: CustomActionStopCallback
  ) {
    return (
      (
        await api.MaaRegisterCustomAction({
          inst: this._inst!,
          name,
          action: {
            run: run._cb!,
            stop: stop._cb!
          }
        })
      ).return > 0
    )
  }

  async unregisterCustomAction(name: string) {
    return (await api.MaaUnregisterCustomAction({ inst: this._inst!, name })).return > 0
  }

  async clearCustomAction() {
    return (await api.MaaClearCustomAction({ inst: this._inst! })).return > 0
  }

  async inited() {
    return (await api.MaaInited({ inst: this._inst! })).return > 0
  }

  async running() {
    return (await api.MaaRunning({ inst: this._inst! })).return > 0
  }
}

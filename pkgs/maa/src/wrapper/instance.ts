import { api } from '../schema'
import type { Status } from '../types'
import { __Disposable } from '../utils/dispose'
import {
  CustomActionRunCallback,
  type CustomActionRunCallbackFunc,
  CustomActionStopCallback,
  type CustomActionStopCallbackFunc,
  TrivialCallback,
  type TrivialCallbackFunc
} from './callback'
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

export class Instance extends __Disposable {
  _inst: InstanceId | null = null
  _ctrl: Controller | null = null
  _res: Resource | null = null
  _callback: TrivialCallback | null = null
  _custom: Record<string, __Disposable[]> = {}

  async create(callback: TrivialCallbackFunc) {
    this._callback = new TrivialCallback()
    if (!(await this._callback.prepareCallback(callback))) {
      this._callback = null
      return false
    }
    this._inst = (await api.MaaCreate({ callback: this._callback._cb! })).return as InstanceId
    if (this._inst) {
      const handle = this._inst
      const clear = () => {
        api.MaaDestroy({ inst: handle })
      }
      this.__defer(clear)
    }
    return !!this._inst
  }

  async bindCtrl(ctrl: Controller) {
    this._ctrl = ctrl
    return (await api.MaaBindController({ inst: this._inst!, ctrl: ctrl._ctrl! })).return > 0
  }

  async bindRes(res: Resource) {
    this._res = res
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
    run: CustomActionRunCallbackFunc,
    stop: CustomActionStopCallbackFunc
  ) {
    const run_cb = new CustomActionRunCallback()
    const stop_cb = new CustomActionStopCallback()
    if (!(await run_cb.prepareCallback(run)) || !(await stop_cb.prepareCallback(stop))) {
      return false
    }
    const key = `Action#${name}`
    this._custom[key] = this._custom[key] ?? []
    this._custom[key].push(run_cb, stop_cb)
    return (
      (
        await api.MaaRegisterCustomAction({
          inst: this._inst!,
          name,
          action: {
            run: run_cb._cb!,
            stop: stop_cb._cb!
          }
        })
      ).return > 0
    )
  }

  async unregisterCustomAction(name: string) {
    const ret = (await api.MaaUnregisterCustomAction({ inst: this._inst!, name })).return > 0
    const key = `Action#${name}`
    delete this._custom[key]
    return ret
  }

  async clearCustomAction() {
    const ret = (await api.MaaClearCustomAction({ inst: this._inst! })).return > 0

    Object.keys(this._custom)
      .filter(k => k.startsWith('Action#'))
      .forEach(key => {
        delete this._custom[key]
      })

    return ret
  }

  async inited() {
    return (await api.MaaInited({ inst: this._inst! })).return > 0
  }

  async running() {
    return (await api.MaaRunning({ inst: this._inst! })).return > 0
  }
}

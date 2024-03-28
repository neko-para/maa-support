import { api } from '@maa/schema'

import { type AdbConfig, ControllerOption, Status } from '../types'
import type { __Disposable } from '../utils/dispose'
import type { TrivialCallback } from './callback'

export type ControllerId = string & { __kind: 'MaaControllerAPI' }
export type ControllerActionId = number & { __kind: 'MaaResourceActionId' }

class ControllerActionHolder {
  _ctrl: ControllerId
  _id: ControllerActionId

  constructor(ctrl: ControllerId, id: ControllerActionId) {
    this._ctrl = ctrl
    this._id = id
  }

  async status() {
    return (await api.MaaControllerStatus({ ctrl: this._ctrl, id: this._id })).return as Status
  }

  async wait() {
    return (await api.MaaControllerWait({ ctrl: this._ctrl, id: this._id })).return as Status
  }
}

export class Controller implements __Disposable {
  _ctrl: ControllerId | null = null
  _cb: TrivialCallback | null = null

  async dispose() {
    if (this._ctrl) {
      await api.MaaControllerDestroy({ ctrl: this._ctrl })
      this._ctrl = null
    }
    await this._cb?.dispose()
  }

  async destroy() {
    await this.dispose()
  }

  async setOption(
    key: ControllerOption.ScreenshotTargetLongSide | ControllerOption.ScreenshotTargetShortSide,
    value: number
  ): Promise<boolean>
  async setOption(
    key: ControllerOption.DefaultAppPackageEntry | ControllerOption.DefaultAppPackage,
    value: string
  ): Promise<boolean>
  async setOption(key: ControllerOption.Recording, value: boolean): Promise<boolean>
  async setOption(key: ControllerOption, value: number | string | boolean) {
    switch (key) {
      case ControllerOption.ScreenshotTargetLongSide:
      case ControllerOption.ScreenshotTargetShortSide:
        return (
          (
            await api.MaaControllerSetOptionInteger({
              ctrl: this._ctrl!,
              key,
              value: value as number
            })
          ).return > 0
        )
      case ControllerOption.DefaultAppPackageEntry:
      case ControllerOption.DefaultAppPackage:
        return (
          (
            await api.MaaControllerSetOptionString({
              ctrl: this._ctrl!,
              key,
              value: value as string
            })
          ).return > 0
        )
      case ControllerOption.Recording:
        return (
          (
            await api.MaaControllerSetOptionBoolean({
              ctrl: this._ctrl!,
              key,
              value: value as boolean
            })
          ).return > 0
        )
    }
    return false
  }

  async postConnection() {
    const id = (await api.MaaControllerPostConnection({ ctrl: this._ctrl! }))
      .return as ControllerActionId
    return new ControllerActionHolder(this._ctrl!, id)
  }

  async postScreencap() {
    const id = (await api.MaaControllerPostScreencap({ ctrl: this._ctrl! }))
      .return as ControllerActionId
    return new ControllerActionHolder(this._ctrl!, id)
  }

  async connected() {
    return (await api.MaaControllerConnected({ ctrl: this._ctrl! })).return > 0
  }

  async uuid() {
    const ret = await api.MaaControllerGetUUID({ ctrl: this._ctrl! })
    if (ret.return > 0) {
      return ret.buffer
    } else {
      return null
    }
  }

  async image(decode?: true): Promise<Buffer>
  async image(decode: false): Promise<string>
  async image(decode = true) {
    const bufId = (await api.MaaCreateImageBuffer()).return
    if ((await api.MaaControllerGetImage({ ctrl: this._ctrl!, buffer: bufId })).return === 0) {
      await api.MaaDestroyImageBuffer({ handle: bufId })
      return null
    }
    const data = (await api.MaaGetImageEncoded({ handle: bufId })).return
    await api.MaaDestroyImageBuffer({ handle: bufId })
    if (decode) {
      return Buffer.from(data, 'base64')
    } else {
      return data
    }
  }
}

export class AdbController extends Controller {
  async create(cfg: AdbConfig, agent_path: string, callback: TrivialCallback) {
    this._cb = callback
    this._ctrl = (
      await api.MaaAdbControllerCreateV2({
        ...cfg,
        agent_path,
        callback: this._cb._cb!
      })
    ).return as ControllerId
    return !!this._ctrl
  }
}

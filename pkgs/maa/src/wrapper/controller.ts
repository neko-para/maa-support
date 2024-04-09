import { api } from '../schema'
import { type AdbConfig, ControllerOption, Status, Win32Type } from '../types'
import { __Disposable } from '../utils/dispose'
import type { TrivialCallback } from './callback'
import type { HwndId } from './device'
import { Image } from './image'

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

export class Controller extends __Disposable {
  _ctrl: ControllerId | null = null

  async dispose() {
    if (this._ctrl) {
      await api.MaaControllerDestroy({ ctrl: this._ctrl })
      this._ctrl = null
    }
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

  async image(img?: Image) {
    let free = false
    if (!img) {
      free = true
      img = new Image()
      await img.create()
    }
    if ((await api.MaaControllerGetImage({ ctrl: this._ctrl!, buffer: img._img! })).return > 0) {
      return img
    } else {
      if (free) {
        await img.unref()
      }
      return null
    }
  }
}

export class AdbController extends Controller {
  async create(cfg: AdbConfig, agent_path: string, callback: TrivialCallback) {
    this.defer(callback)
    this._ctrl = (
      await api.MaaAdbControllerCreateV2({
        ...cfg,
        agent_path,
        callback: callback._cb!
      })
    ).return as ControllerId
    return !!this._ctrl
  }
}

export class Win32Controller extends Controller {
  async create(hWnd: HwndId, type: Win32Type, callback: TrivialCallback) {
    this.defer(callback)
    this._ctrl = (
      await api.MaaWin32ControllerCreate({
        hWnd,
        type,
        callback: callback._cb!
      })
    ).return as ControllerId
    return !!this._ctrl
  }
}

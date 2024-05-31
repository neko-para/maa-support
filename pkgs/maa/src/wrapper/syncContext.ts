import { api } from '../schema'
import type { MaaRect } from '../types'
import { ImageHandle } from './image'

export type SyncContextId = string & { __kind: 'MaaSyncContextAPI' }

export class SyncContext {
  _id: SyncContextId

  constructor(id: SyncContextId) {
    this._id = id
  }

  async runTask(task: string, param: string | Record<string, unknown>) {
    if (typeof param !== 'string') {
      param = JSON.stringify(param)
    }
    return (
      (await api.MaaSyncContextRunTask({ sync_context: this._id, task_name: task, param })).return >
      0
    )
  }

  async runRecognizer(image: Buffer, task: string, param: string | Record<string, unknown>) {
    if (typeof param !== 'string') {
      param = JSON.stringify(param)
    }
    const img = (await api.MaaCreateImageBuffer()).return
    await api.MaaSetImageEncoded({ handle: img, data: image.toString('base64') })
    const ret = await api.MaaSyncContextRunRecognition({
      sync_context: this._id,
      image: img,
      task_name: task,
      task_param: param
    })
    await api.MaaDestroyImageBuffer({ handle: img })
    return ret.return > 0
      ? {
          box: ret.out_box as MaaRect,
          detail: ret.out_detail
        }
      : null
  }

  async runAction(
    task: string,
    param: string | Record<string, unknown>,
    box: MaaRect,
    detail: string
  ) {
    if (typeof param !== 'string') {
      param = JSON.stringify(param)
    }
    return (
      (
        await api.MaaSyncContextRunAction({
          sync_context: this._id,
          task_name: task,
          task_param: param,
          cur_box: box,
          cur_rec_detail: detail
        })
      ).return > 0
    )
  }

  async click(x: number, y: number) {
    return (
      (
        await api.MaaSyncContextClick({
          sync_context: this._id,
          x,
          y
        })
      ).return > 0
    )
  }

  async swipe(x1: number, y1: number, x2: number, y2: number, duration: number) {
    return (
      (
        await api.MaaSyncContextSwipe({
          sync_context: this._id,
          x1,
          y1,
          x2,
          y2,
          duration
        })
      ).return > 0
    )
  }

  async pressKey(keycode: number) {
    return (
      (
        await api.MaaSyncContextPressKey({
          sync_context: this._id,
          keycode
        })
      ).return > 0
    )
  }

  async inputText(text: string) {
    return (
      (
        await api.MaaSyncContextInputText({
          sync_context: this._id,
          text
        })
      ).return > 0
    )
  }

  async touchDown(contact: number, x: number, y: number, pressure: number) {
    return (
      (
        await api.MaaSyncContextTouchDown({
          sync_context: this._id,
          contact,
          x,
          y,
          pressure
        })
      ).return > 0
    )
  }

  async touchMove(contact: number, x: number, y: number, pressure: number) {
    return (
      (
        await api.MaaSyncContextTouchMove({
          sync_context: this._id,
          contact,
          x,
          y,
          pressure
        })
      ).return > 0
    )
  }

  async touchUp(contact: number) {
    return (
      (
        await api.MaaSyncContextTouchUp({
          sync_context: this._id,
          contact
        })
      ).return > 0
    )
  }

  async screencap(img?: ImageHandle) {
    if (!img) {
      img = new ImageHandle()
      await img.create()
    }
    if (
      (await api.MaaSyncContextScreencap({ sync_context: this._id!, out_image: img._img! }))
        .return > 0
    ) {
      return img
    } else {
      return null
    }
  }

  async cachedImage(img?: ImageHandle) {
    if (!img) {
      img = new ImageHandle()
      await img.create()
    }
    if (
      (await api.MaaSyncContextCachedImage({ sync_context: this._id!, out_image: img._img! }))
        .return > 0
    ) {
      return img
    } else {
      return null
    }
  }
}

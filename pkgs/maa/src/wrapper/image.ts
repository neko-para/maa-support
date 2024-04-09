import { api } from '../schema'
import { __Disposable } from '../utils/dispose'

export type ImageId = string & { __kind: 'MaaImageBuffer' }

export class Image extends __Disposable {
  _img: ImageId | null = null

  async create() {
    this._img = (await api.MaaCreateImageBuffer()).return as ImageId
    return !!this._img
  }

  async dispose() {
    if (this._img) {
      await api.MaaDestroyImageBuffer({ handle: this._img })
    }
  }

  async isEmpty() {
    return (await api.MaaIsImageEmpty({ handle: this._img! })).return > 0
  }

  async clear() {
    return (await api.MaaClearImage({ handle: this._img! })).return > 0
  }

  async width() {
    return (await api.MaaGetImageWidth({ handle: this._img! })).return
  }

  async height() {
    return (await api.MaaGetImageHeight({ handle: this._img! })).return
  }

  async type() {
    return (await api.MaaGetImageType({ handle: this._img! })).return
  }

  async encoded(decode?: true): Promise<Buffer>
  async encoded(decode: false): Promise<string>
  async encoded(decode = true): Promise<string | Buffer> {
    const base64 = (await api.MaaGetImageEncoded({ handle: this._img! })).return
    if (decode) {
      return Buffer.from(base64, 'base64')
    } else {
      return base64
    }
  }

  async setEncoded(data: string | Buffer) {
    if (data instanceof Buffer) {
      data = data.toString('base64')
    }
    return (await api.MaaSetImageEncoded({ handle: this._img!, data })).return > 0
  }
}

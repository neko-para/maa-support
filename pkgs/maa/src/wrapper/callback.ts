import { callback } from '../schema'
import type { MaaRect } from '../types'
import { wrapCallback } from '../utils/callback'
import { __Disposable } from '../utils/dispose'
import { SyncContext, type SyncContextId } from './syncContext'

export type TrivialId = string & { __kind: 'MaaAPICallback' }
export type CustomRecognizerAnalyzeId = string & { __kind: 'CustomRecognizerAnalyze' }
export type CustomActionRunId = string & { __kind: 'CustomActionRun' }
export type CustomActionStopId = string & { __kind: 'CustomActionStop' }

const $callback = {
  Trivial: wrapCallback(callback.MaaAPICallback, '' as TrivialId),
  CustomRecognizerAnalyze: wrapCallback(
    callback.CustomRecognizerAnalyze,
    '' as CustomRecognizerAnalyzeId
  ),
  CustomActionRun: wrapCallback(callback.CustomActionRun, '' as CustomActionRunId),
  CustomActionStop: wrapCallback(callback.CustomActionStop, '' as CustomActionStopId)
}

export type TrivialCallbackFunc = (msg: string, details_json: string) => Promise<void>

export class TrivialCallback extends __Disposable {
  _func: TrivialCallbackFunc | null = null
  _cb: TrivialId | null = null

  async prepareCallback(callback: TrivialCallbackFunc) {
    const [cb, clear] = await $callback.Trivial.setup(req => callback(req.msg, req.details_json))
    if (!cb) {
      return false
    }
    this._cb = cb
    this.__defer(clear)
    return true
  }
}

export type CustomRecognizerAnalyzeCallbackFunc = (
  sync_context: SyncContext,
  image: Buffer,
  task_name: string,
  custom_recognition_param: string
) => Promise<[ret: boolean, out_box: MaaRect, out_detail: string]>

export class CustomRecognizerAnalyzeCallback extends __Disposable {
  _func: CustomRecognizerAnalyzeCallbackFunc | null = null
  _cb: CustomRecognizerAnalyzeId | null = null
  _cbClear: (() => Promise<void>) | null = null

  async prepareCallback(callback: CustomRecognizerAnalyzeCallbackFunc) {
    const [cb, clear] = await $callback.CustomRecognizerAnalyze.setup(async req => {
      const [ret, box, detail] = await callback(
        new SyncContext(req.sync_context as SyncContextId),
        Buffer.from(req.image, 'base64'),
        req.task_name,
        req.custom_recognition_param
      )
      return {
        return: ret ? 1 : 0,
        out_box: box,
        out_detail: detail
      }
    })
    if (!cb) {
      return false
    }
    this._cb = cb
    this.__defer(clear)
    return true
  }
}
export type CustomActionRunCallbackFunc = (
  sync_context: SyncContext,
  task_name: string,
  custom_action_param: string,
  cur_box: MaaRect,
  cur_rec_detail: string
) => Promise<boolean>

export class CustomActionRunCallback extends __Disposable {
  _func: CustomActionRunCallbackFunc | null = null
  _cb: CustomActionRunId | null = null
  _cbClear: (() => Promise<void>) | null = null

  async prepareCallback(callback: CustomActionRunCallbackFunc) {
    const [cb, clear] = await $callback.CustomActionRun.setup(async req => ({
      return: (await callback(
        new SyncContext(req.sync_context as SyncContextId),
        req.task_name,
        req.custom_action_param,
        req.cur_box,
        req.cur_rec_detail
      ))
        ? 1
        : 0
    }))
    if (!cb) {
      return false
    }
    this._cb = cb
    this.__defer(clear)
    return true
  }
}

export type CustomActionStopCallbackFunc = () => Promise<void>

export class CustomActionStopCallback extends __Disposable {
  _func: CustomActionStopCallbackFunc | null = null
  _cb: CustomActionStopId | null = null
  _cbClear: (() => Promise<void>) | null = null

  async prepareCallback(callback: CustomActionStopCallbackFunc) {
    const [cb, clear] = await $callback.CustomActionStop.setup(async () => {
      await callback()
    })
    if (!cb) {
      return false
    }
    this._cb = cb
    this.__defer(clear)
    return true
  }
}

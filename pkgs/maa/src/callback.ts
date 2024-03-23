import { callback } from '@maa/schema'

import { wrapCallback } from './utils/callback'

export type APICallbackId = string & { __kind: 'MaaAPICallback' }
export type CustomRecognizerAnalyzeId = string & { __kind: 'CustomRecognizerAnalyze' }
export type CustomActionRunId = string & { __kind: 'CustomActionRun' }
export type CustomActionStopId = string & { __kind: 'CustomActionStop' }

export const $callback = {
  APICallback: wrapCallback(callback.MaaAPICallback, '' as APICallbackId),
  CustomRecognizerAnalyze: wrapCallback(
    callback.CustomRecognizerAnalyze,
    '' as CustomRecognizerAnalyzeId
  ),
  CustomActionRun: wrapCallback(callback.CustomActionRun, '' as CustomActionRunId),
  CustomActionStop: wrapCallback(callback.CustomActionStop, '' as CustomActionStopId)
}

declare module '@maa/maa/callback' {
  export type APICallbackId = string & {
    __kind: 'MaaAPICallback'
  }
  export type APICallback = (msg: string, details_json: string) => Promise<void>
  function dump(): Promise<string[]>
  function add(): Promise<APICallbackId | null>
  function del(id: APICallbackId): Promise<void>
  function pull(id: APICallbackId): Promise<string[]>
  function request(
    id: APICallbackId,
    cid: string
  ): Promise<[msg: string, details_json: string]>
  function response(id: APICallbackId, cid: string): Promise<void>
  function process(
    id: APICallbackId,
    cid: string,
    func: APICallback
  ): Promise<void>
  export const $callback: {
    dump: typeof dump
    add: typeof add
    del: typeof del
    pull: typeof pull
    request: typeof request
    response: typeof response
    process: typeof process
  }
  export {}
}
declare module '@maa/maa/controller' {
  import type {
    APICallbackId,
    AdbType,
    ControllerOption,
    Status
  } from '@maa/maa/index'
  export type ControllerId = string & {
    __kind: 'MaaControllerAPI'
  }
  export type ControllerActionId = number & {
    __kind: 'MaaResourceActionId'
  }
  export interface AdbConfig {
    adb_path: string
    address: string
    type: AdbType
    config: string
  }
  function dump(): Promise<{
    [key: string]: {
      pointer: string
    }
  }>
  function createAdb(
    cfg: AdbConfig,
    agent_path: string,
    callback: APICallbackId
  ): Promise<ControllerId | null>
  function destroy(ctrl: ControllerId): Promise<void>
  function setOptionI(
    ctrl: ControllerId,
    key:
      | ControllerOption.ScreenshotTargetLongSide
      | ControllerOption.ScreenshotTargetShortSide,
    value: number
  ): Promise<boolean>
  function setOptionS(
    ctrl: ControllerId,
    key:
      | ControllerOption.DefaultAppPackageEntry
      | ControllerOption.DefaultAppPackage,
    value: string
  ): Promise<boolean>
  function setOptionB(
    ctrl: ControllerId,
    key: ControllerOption.Recording,
    value: boolean
  ): Promise<boolean>
  function postConnection(ctrl: ControllerId): Promise<ControllerActionId>
  function postScreencap(ctrl: ControllerId): Promise<ControllerActionId>
  function status(ctrl: ControllerId, id: ControllerActionId): Promise<Status>
  function wait(ctrl: ControllerId, id: ControllerActionId): Promise<Status>
  function connected(ctrl: ControllerId): Promise<boolean>
  function uuid(ctrl: ControllerId): Promise<string | null>
  function image(ctrl: ControllerId, decode?: boolean): Promise<string | null>
  export const $controller: {
    dump: typeof dump
    createAdb: typeof createAdb
    destroy: typeof destroy
    setOptionI: typeof setOptionI
    setOptionS: typeof setOptionS
    setOptionB: typeof setOptionB
    postConnection: typeof postConnection
    postScreencap: typeof postScreencap
    status: typeof status
    wait: typeof wait
    connected: typeof connected
    uuid: typeof uuid
    image: typeof image
  }
  export {}
}
declare module '@maa/maa/device' {
  import type { AdbConfig } from '@maa/maa/controller'
  export interface DeviceInfo extends AdbConfig {
    name: string
  }
  function post(): Promise<boolean>
  function postWithAdb(adb_path: string): Promise<boolean>
  function completed(): Promise<boolean>
  function wait(): Promise<number>
  function count(): Promise<number>
  function get(index: number): Promise<DeviceInfo>
  export const $device: {
    post: typeof post
    postWithAdb: typeof postWithAdb
    completed: typeof completed
    wait: typeof wait
    count: typeof count
    get: typeof get
  }
  export {}
}
declare module '@maa/maa/global' {
  function version(): Promise<string>
  function init(): Promise<boolean>
  export const $global: {
    version: typeof version
    init: typeof init
  }
  export {}
}
declare module '@maa/maa/index' {
  export * from '@maa/maa/global'
  export * from '@maa/maa/callback'
  export * from '@maa/maa/resource'
  export * from '@maa/maa/controller'
  export * from '@maa/maa/instance'
  export * from '@maa/maa/device'
  export * from '@maa/maa/types'
}
declare module '@maa/maa/instance' {
  import type { ControllerId, ResourceId } from '@maa/maa/index'
  import type { APICallbackId } from '@maa/maa/callback'
  import type { Status } from '@maa/maa/types'
  export type InstanceId = string & {
    __kind: 'MaaInstanceAPI'
  }
  export type InstanceTaskId = number & {
    __kind: 'InstanceTaskId'
  }
  function dump(): Promise<{
    [key: string]: {
      pointer: string
    }
  }>
  function create(callback: APICallbackId): Promise<InstanceId | null>
  function destroy(inst: InstanceId): Promise<void>
  function bindRes(inst: InstanceId, res: ResourceId): Promise<boolean>
  function bindCtrl(inst: InstanceId, ctrl: ControllerId): Promise<boolean>
  function inited(inst: InstanceId): Promise<boolean>
  function postTask(
    inst: InstanceId,
    entry: string,
    param: string
  ): Promise<InstanceTaskId>
  function setParam(
    inst: InstanceId,
    id: InstanceTaskId,
    param: string
  ): Promise<boolean>
  function status(inst: InstanceId, id: InstanceTaskId): Promise<Status>
  function wait(inst: InstanceId, id: InstanceTaskId): Promise<Status>
  function finished(inst: InstanceId): Promise<boolean>
  function postStop(inst: InstanceId): Promise<boolean>
  function res(inst: InstanceId): Promise<ResourceId>
  function ctrl(inst: InstanceId): Promise<ControllerId>
  export const $instance: {
    dump: typeof dump
    create: typeof create
    destroy: typeof destroy
    bindRes: typeof bindRes
    bindCtrl: typeof bindCtrl
    inited: typeof inited
    postTask: typeof postTask
    setParam: typeof setParam
    status: typeof status
    wait: typeof wait
    finished: typeof finished
    postStop: typeof postStop
    res: typeof res
    ctrl: typeof ctrl
  }
  export {}
}
declare module '@maa/maa/resource' {
  import type { APICallbackId } from '@maa/maa/callback'
  import type { Status } from '@maa/maa/types'
  export type ResourceId = string & {
    __kind: 'MaaResourceAPI'
  }
  export type ResourceActionId = number & {
    __kind: 'MaaResourceActionId'
  }
  function dump(): Promise<{
    [key: string]: {
      pointer: string
    }
  }>
  function create(callback: APICallbackId): Promise<ResourceId | null>
  function destroy(res: ResourceId): Promise<void>
  function postPath(res: ResourceId, path: string): Promise<ResourceActionId>
  function status(res: ResourceId, id: ResourceActionId): Promise<Status>
  function wait(res: ResourceId, id: ResourceActionId): Promise<Status>
  function loaded(res: ResourceId): Promise<boolean>
  function getHash(res: ResourceId): Promise<string | null>
  function getTaskList(res: ResourceId): Promise<string | null>
  export const $resource: {
    dump: typeof dump
    create: typeof create
    destroy: typeof destroy
    postPath: typeof postPath
    status: typeof status
    wait: typeof wait
    loaded: typeof loaded
    getHash: typeof getHash
    getTaskList: typeof getTaskList
  }
  export {}
}
declare module '@maa/maa/types' {
  export const enum Status {
    Invalid = 0,
    Pending = 1000,
    Running = 2000,
    Success = 3000,
    Failed = 4000
  }
  export const enum ControllerOption {
    Invalid = 0,
    ScreenshotTargetLongSide = 1,
    ScreenshotTargetShortSide = 2,
    DefaultAppPackageEntry = 3,
    DefaultAppPackage = 4,
    Recording = 5
  }
  export const enum AdbType {
    Invalid = 0,
    Touch_Adb = 1,
    Touch_MiniTouch = 2,
    Touch_MaaTouch = 3,
    Touch_Mask = 255,
    Key_Adb = 256,
    Key_MaaTouch = 512,
    Key_Mask = 65280,
    Input_Preset_Adb = 257,
    Input_Preset_Minitouch = 258,
    Input_Preset_Maatouch = 515,
    Screencap_FastestWay = 65536,
    Screencap_RawByNetcat = 131072,
    Screencap_RawWithGzip = 196608,
    Screencap_Encode = 262144,
    Screencap_EncodeToFile = 327680,
    Screencap_MinicapDirect = 393216,
    Screencap_MinicapStream = 458752,
    Screencap_Mask = 16711680
  }
}
declare module '@maa/maa' {
  import main = require('@maa/maa/index')
  export = main
}

declare const maa: {
  print(str: string): void
  fail(err: string | Error): void
  api: typeof import('@maa/maa')
  utils: {
    getCallback: () => Promise<import('@maa/maa').APICallbackId | null>
  }
}

declare const context: Record<string, unknown>

import { api, opaque } from '@maa/schema'

import type { APICallbackId, AdbType, ControllerOption, Status } from '.'

export type ControllerId = string & { __kind: 'MaaControllerAPI' }
export type ControllerActionId = number & { __kind: 'MaaResourceActionId' }

export interface AdbConfig {
  adb_path: string
  address: string
  type: AdbType
  config: string
}

async function dump() {
  return await opaque.MaaControllerAPI()
}

async function createAdb(cfg: AdbConfig, agent_path: string, callback: APICallbackId) {
  const id = (
    await api.MaaAdbControllerCreateV2({
      ...cfg,
      agent_path,
      callback
    })
  ).return as ControllerId
  return id === '' ? null : id
}

async function destroy(ctrl: ControllerId) {
  await api.MaaControllerDestroy({ ctrl })
}

async function setOptionI(
  ctrl: ControllerId,
  key: ControllerOption.ScreenshotTargetLongSide | ControllerOption.ScreenshotTargetShortSide,
  value: number
) {
  return (await api.MaaControllerSetOptionInteger({ ctrl, key, value })).return > 0
}

async function setOptionS(
  ctrl: ControllerId,
  key: ControllerOption.DefaultAppPackageEntry | ControllerOption.DefaultAppPackage,
  value: string
) {
  return (await api.MaaControllerSetOptionString({ ctrl, key, value })).return > 0
}

async function setOptionB(ctrl: ControllerId, key: ControllerOption.Recording, value: boolean) {
  return (await api.MaaControllerSetOptionBoolean({ ctrl, key, value })).return > 0
}

async function postConnection(ctrl: ControllerId) {
  return (await api.MaaControllerPostConnection({ ctrl })).return as ControllerActionId
}

async function postScreencap(ctrl: ControllerId) {
  return (await api.MaaControllerPostScreencap({ ctrl })).return as ControllerActionId
}

async function status(ctrl: ControllerId, id: ControllerActionId) {
  return (await api.MaaControllerStatus({ ctrl, id })).return as Status
}

async function wait(ctrl: ControllerId, id: ControllerActionId) {
  return (await api.MaaControllerWait({ ctrl, id })).return as Status
}

async function connected(ctrl: ControllerId) {
  return (await api.MaaControllerConnected({ ctrl })).return > 0
}

async function uuid(ctrl: ControllerId) {
  const ret = await api.MaaControllerGetUUID({ ctrl })
  if (ret.return > 0) {
    return ret.buffer
  } else {
    return null
  }
}

async function image(ctrl: ControllerId, decode = true) {
  const bufId = (await api.MaaCreateImageBuffer()).return
  if ((await api.MaaControllerGetImage({ ctrl, buffer: bufId })).return === 0) {
    await api.MaaDestroyImageBuffer({ handle: bufId })
    return null
  }
  const data = (await api.MaaGetImageEncoded({ handle: bufId })).return
  await api.MaaDestroyImageBuffer({ handle: bufId })
  if (decode) {
    return atob(data)
  } else {
    return data
  }
}

export const $controller = {
  dump,

  createAdb,
  destroy,
  setOptionI,
  setOptionS,
  setOptionB,
  postConnection,
  postScreencap,
  status,
  wait,
  connected,
  uuid,
  image
}

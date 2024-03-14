import { api, handle } from '@maa/schema'

import type {
  APICallbackId,
  ControllerId,
  CustomActionRunId,
  CustomActionStopId,
  ResourceId,
  Status
} from '.'

export type InstanceId = string & { __kind: 'MaaInstanceAPI' }
export type InstanceTaskId = number & { __kind: 'InstanceTaskId' }

async function dump() {
  return await handle.MaaInstanceAPI.dump()
}

async function create(callback: APICallbackId) {
  const id = (await api.MaaCreate({ callback })).return as InstanceId
  return id === '' ? null : id
}

async function destroy(inst: InstanceId) {
  await api.MaaDestroy({ inst })
}

async function bindRes(inst: InstanceId, res: ResourceId) {
  return (await api.MaaBindResource({ inst, res })).return > 0
}

async function bindCtrl(inst: InstanceId, ctrl: ControllerId) {
  return (await api.MaaBindController({ inst, ctrl })).return > 0
}

async function inited(inst: InstanceId) {
  return (await api.MaaInited({ inst })).return > 0
}

async function registerCustomAction(
  inst: InstanceId,
  name: string,
  run: CustomActionRunId,
  stop: CustomActionStopId
) {
  return (
    (
      await api.MaaRegisterCustomAction({
        inst,
        name,
        action: {
          run,
          stop
        }
      })
    ).return > 0
  )
}

async function unregisterCustomAction(inst: InstanceId, name: string) {
  return (await api.MaaUnregisterCustomAction({ inst, name })).return > 0
}

async function clearCustomAction(inst: InstanceId) {
  return (await api.MaaClearCustomAction({ inst })).return > 0
}

async function postTask(inst: InstanceId, entry: string, param: string) {
  return (await api.MaaPostTask({ inst, entry, param })).return as InstanceTaskId
}

async function setParam(inst: InstanceId, id: InstanceTaskId, param: string) {
  return (await api.MaaSetTaskParam({ inst, id, param })).return > 0
}

async function status(inst: InstanceId, id: InstanceTaskId) {
  return (await api.MaaTaskStatus({ inst, id })).return as Status
}

async function wait(inst: InstanceId, id: InstanceTaskId) {
  return (await api.MaaWaitTask({ inst, id })).return as Status
}

async function finished(inst: InstanceId) {
  return !(await running(inst))
}

async function running(inst: InstanceId) {
  return (await api.MaaRunning({ inst })).return > 0
}

async function postStop(inst: InstanceId) {
  return (await api.MaaPostStop({ inst })).return > 0
}

async function res(inst: InstanceId) {
  return (await api.MaaGetResource({ inst })).return as ResourceId
}

async function ctrl(inst: InstanceId) {
  return (await api.MaaGetController({ inst })).return as ControllerId
}

export const $instance = {
  dump,

  create,
  destroy,
  bindRes,
  bindCtrl,
  inited,
  registerCustomAction,
  unregisterCustomAction,
  clearCustomAction,
  postTask,
  setParam,
  status,
  wait,
  finished,
  postStop,
  res,
  ctrl
}

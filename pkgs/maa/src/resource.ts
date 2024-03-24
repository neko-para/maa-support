import { api, handle } from '@maa/schema'

import type { APICallbackId } from './callback'
import type { Status } from './types'

export type ResourceId = string & { __kind: 'MaaResourceAPI' }
export type ResourceActionId = number & { __kind: 'MaaResourceActionId' }

async function dump() {
  return await handle.MaaResourceAPI.dump()
}

async function create(callback: APICallbackId) {
  const id = (await api.MaaResourceCreate({ callback })).return as ResourceId
  return id === '' ? null : id
}

async function destroy(res: ResourceId) {
  await api.MaaResourceDestroy({ res })
}

async function postPath(res: ResourceId, path: string) {
  return (await api.MaaResourcePostPath({ res, path })).return as ResourceActionId
}

async function status(res: ResourceId, id: ResourceActionId) {
  return (await api.MaaResourceStatus({ res, id })).return as Status
}

async function wait(res: ResourceId, id: ResourceActionId) {
  return (await api.MaaResourceWait({ res, id })).return as Status
}

async function loaded(res: ResourceId) {
  return (await api.MaaResourceLoaded({ res })).return > 0
}

async function clear(res: ResourceId) {
  return (await api.MaaResourceClear({ res })).return > 0
}

async function getHash(res: ResourceId) {
  const ret = await api.MaaResourceGetHash({ res })
  return ret.return > 0 ? ret.buffer : null
}

async function getTaskList(res: ResourceId) {
  const ret = await api.MaaResourceGetTaskList({ res })
  return ret.return > 0 ? ret.buffer : null
}

export const $resource = {
  dump,

  create,
  destroy,
  postPath,
  status,
  wait,
  loaded,
  clear,
  getHash,
  getTaskList
}

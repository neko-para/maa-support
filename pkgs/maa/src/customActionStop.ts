import { callback as _callback } from '@maa/schema'

const cb = _callback.CustomActionStop

export type CustomActionStopId = string & { __kind: 'CustomActionStop' }
export type CustomActionStop = () => Promise<void>

async function dump() {
  return (await cb.dump()).ids
}

async function add() {
  const id = (await cb.new()).id as CustomActionStopId
  return id === '' ? null : id
}

async function del(id: CustomActionStopId) {
  await cb.free({ id })
}

async function pull(id: CustomActionStopId) {
  return (await cb.query({ id })).ids
}

async function request(id: CustomActionStopId, cid: string): Promise<Parameters<CustomActionStop>> {
  const arg = await cb.req({ id, cid })
  return []
}

async function response(id: CustomActionStopId, cid: string) {
  await cb.res({ id, cid, ret: {} })
}

async function process(id: CustomActionStopId, cid: string, func: CustomActionStop) {
  const arg = await request(id, cid)
  await func(...arg)
  await response(id, cid)
}

export const $customActionStop = {
  dump,

  add,
  del,
  pull,
  request,
  response,
  process
}

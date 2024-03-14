import { callback as _callback } from '@maa/schema'

const cb = _callback.MaaAPICallback

export type APICallbackId = string & { __kind: 'MaaAPICallback' }
export type APICallback = (msg: string, details_json: string) => Promise<void>

async function dump() {
  return (await cb.dump()).ids
}

async function add() {
  const id = (await cb.new()).id as APICallbackId
  return id === '' ? null : id
}

async function del(id: APICallbackId) {
  await cb.free({ id })
}

async function pull(id: APICallbackId) {
  return (await cb.query({ id })).ids
}

async function request(id: APICallbackId, cid: string): Promise<Parameters<APICallback>> {
  const arg = await cb.req({ id, cid })
  return [arg.msg, arg.details_json]
}

async function response(id: APICallbackId, cid: string) {
  await cb.res({ id, cid, ret: {} })
}

async function process(id: APICallbackId, cid: string, func: APICallback) {
  const arg = await request(id, cid)
  await func(...arg)
  await response(id, cid)
}

export const $callback = {
  dump,

  add,
  del,
  pull,
  request,
  response,
  process
}

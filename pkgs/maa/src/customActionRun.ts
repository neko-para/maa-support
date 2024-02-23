import { callback as _callback } from '@maa/schema'

import { MaaRect } from '.'

const cb = _callback.CustomActionRun

export type CustomActionRunId = string & { __kind: 'CustomActionRun' }
export type CustomActionRun = (
  sync_context: string,
  task_name: string,
  custom_action_param: string,
  cur_box: MaaRect,
  cur_rec_detail: string
) => Promise<void>

async function dump() {
  return (await cb.dump()).ids
}

async function add() {
  const id = (await cb.add()).id as CustomActionRunId
  return id === '' ? null : id
}

async function del(id: CustomActionRunId) {
  await cb.del({ id })
}

async function pull(id: CustomActionRunId) {
  return (await cb.pull({ id })).ids
}

async function request(id: CustomActionRunId, cid: string): Promise<Parameters<CustomActionRun>> {
  const arg = await cb.request({ id, cid })
  return [arg.sync_context, arg.task_name, arg.custom_action_param, arg.cur_box, arg.cur_rec_detail]
}

async function response(id: CustomActionRunId, cid: string) {
  await cb.response({ id, cid })
}

async function process(id: CustomActionRunId, cid: string, func: CustomActionRun) {
  const arg = await request(id, cid)
  await func(...arg)
  await response(id, cid)
}

export const $customActionRun = {
  dump,

  add,
  del,
  pull,
  request,
  response,
  process
}

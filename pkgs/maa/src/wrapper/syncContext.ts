import { api } from '@maa/schema'

export type SyncContextId = string & { __kind: 'MaaSyncContextAPI' }

export class SyncContext {
  _id: SyncContextId

  constructor(id: SyncContextId) {
    this._id = id
  }

  async runTask(task: string, param: string | Record<string, unknown>) {
    if (typeof param !== 'string') {
      param = JSON.stringify(param)
    }
    return (
      (await api.MaaSyncContextRunTask({ sync_context: this._id, task_name: task, param })).return >
      0
    )
  }
}

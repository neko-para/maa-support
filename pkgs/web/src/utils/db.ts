import Dexie, { type Subscription, type Table, liveQuery } from 'dexie'
import { type Ref, ref } from 'vue'

export type FsEntry = {
  id: string
  data: Blob
}

export class MaaDb extends Dexie {
  fs!: Table<FsEntry>
  fsEntry: Ref<string[]>
  fsEntrySub: Subscription

  constructor() {
    super('maa')
    this.version(1).stores({
      fs: 'id,data'
    })

    this.fsEntry = ref([])

    const result = liveQuery(() => {
      return this.fs.toArray()
    })
    this.fsEntrySub = result.subscribe({
      next: value => {
        this.fsEntry.value = value.map(x => x.id)
      }
    })
  }

  async putFs(id: string, data: Blob) {
    try {
      await this.fs.bulkPut([{ id, data }])
      return true
    } catch (_) {
      return false
    }
  }

  async getFs(id: string) {
    const res = await this.fs.where('id').equals(id).toArray()
    if (res.length === 1) {
      return res[0].data
    } else {
      return null
    }
  }

  async delFs(id: string) {
    await this.fs.where('id').equals(id).delete()
  }
}

export const db = new MaaDb()

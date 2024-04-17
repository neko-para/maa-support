import * as zip from '@zip.js/zip.js'
import Dexie, { type Table } from 'dexie'

import { fs } from './fs'

// async function setupDB() {
//   const request = window.indexedDB.open('maa', 1)
//   return new Promise<IDBDatabase | null>(resolve => {
//     let counter = 1
//     request.onsuccess = event => {
//       counter -= 1
//       if (counter === 0) {
//         resolve((event.target as IDBOpenDBRequest).result)
//       }
//     }
//     request.onerror = event => {
//       console.log('db error:', (event.target as IDBOpenDBRequest).error)
//       resolve(null)
//     }
//     request.onupgradeneeded = event => {
//       counter += 1
//       const db = (event.target as IDBOpenDBRequest).result
//       const store = db.createObjectStore('fs', {
//         keyPath: 'id'
//       })
//       store.transaction.oncomplete = event => {
//         counter -= 1
//         if (counter === 0) {
//           resolve(db)
//         }
//       }
//     }
//   })
// }

// class Db {
//   db: IDBDatabase | null = null

//   async init() {
//     this.db = await setupDB()
//     console.log('inited!')
//   }

//   async save(id = 'current') {
//     if (!this.db) {
//       return false
//     }
//     const blobWriter = new zip.BlobWriter('application/zip')
//     const writer = new zip.ZipWriter(blobWriter, { bufferedWrite: true })
//     await fs.makeZip(writer)
//     await writer.close()
//     const data = await blobWriter.getData()
//     const store = this.db.transaction('fs', 'readwrite').objectStore('fs')
//     store.add({
//       id,
//       data
//     }).onerror
//     return true
//   }

//   async load(id = 'current') {

//   }
// }

// export const db = new Db()
// db.init()

export type FsEntry = {
  id: string
  data: Blob
}

export class MaaDb extends Dexie {
  fs!: Table<FsEntry>

  constructor() {
    super('maa')
    this.version(1).stores({
      fs: 'id,data'
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
}

export const db = new MaaDb()

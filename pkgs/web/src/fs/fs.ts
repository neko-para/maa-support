import { watchDebounced } from '@vueuse/core'
import * as zip from '@zip.js/zip.js'
import { type UnwrapRef, type WatchStopHandle, computed, markRaw, reactive, ref, watch } from 'vue'

import { db } from '@/utils/db'

type RefLike<T> = { value: T }

type FileEntry = {
  file: true
} & (
  | {
      content: string
      uri?: never
    }
  | {
      content?: never
      uri: string
    }
)

type DirEntry = {
  file?: never
  child: {
    [name: string]: FileEntry | DirEntry
  }
}

export class BlobManager {
  index: Set<string>

  constructor() {
    this.index = new Set()
    markRaw(this.index)
  }

  make(data: Uint8Array | Blob) {
    const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]))
    this.index.add(url)
    return url
  }

  reset() {
    for (const url of this.index) {
      URL.revokeObjectURL(url)
    }
    this.index = new Set()
  }
}

export class MemFS {
  name: string
  root: DirEntry
  blob: BlobManager
  watch: WatchStopHandle | null

  constructor(name: string = 'root') {
    this.name = name
    this.root = {
      child: {}
    }
    this.blob = new BlobManager()
    this.watch = null
    this.reset()
  }

  resolve(path: string) {
    return path.split('/').filter(x => x)
  }

  normalize(path: string) {
    return this.resolve(path).join('/')
  }

  join(...segs: string[]) {
    return segs
      .map(p => this.resolve(p))
      .flat()
      .filter(x => x)
      .join('/')
  }

  track(items: string[], create = true): DirEntry | null {
    let current = this.root
    for (const item of items) {
      if (current.child[item]) {
        if (current.child[item].file) {
          return null
        } else {
          current = current.child[item]
        }
      } else {
        if (!create) {
          return null
        }
        const entry: DirEntry = {
          child: {}
        }
        current.child[item] = entry
        current = entry
      }
    }
    return current
  }

  trackEntry(items: string[]): FileEntry | DirEntry | null {
    let current = this.root
    for (const [idx, item] of items.entries()) {
      if (current.child[item]) {
        if (current.child[item].file) {
          if (idx === items.length - 1) {
            return current.child[item]
          } else {
            return null
          }
        } else {
          current = current.child[item]
        }
      } else {
        return null
      }
    }
    return current
  }

  reset() {
    this.root = {
      child: {}
    }
    this.blob.reset()

    this.mkdir('/pipeline')
    this.mkdir('/image')
  }

  dirname(res: string | string[]) {
    if (typeof res === 'string') {
      res = this.resolve(res)
    }
    const ret = [...res]
    ret.pop()
    return ret
  }

  basename(res: string | string[]) {
    if (typeof res === 'string') {
      res = this.resolve(res)
    }
    if (res) {
      return res[res.length - 1] ?? ''
    }
    return null
  }

  stat(res: string, distTextBlob?: false): 'file' | 'directory' | null
  stat(res: string, distTextBlob: true): 'text' | 'binary' | 'directory' | null
  stat(res: string, distTextBlob = false) {
    const entry = this.trackEntry(this.resolve(res))
    if (!entry) {
      return null
    }
    if (distTextBlob) {
      return entry.file ? ('content' in entry ? 'text' : 'binary') : 'directory'
    } else {
      return entry.file ? 'file' : 'directory'
    }
  }

  mkdir(path: string) {
    return !!this.track(this.resolve(path))
  }

  rm(path: string) {
    const dir = this.track(this.dirname(path), false)
    const name = this.basename(path)
    if (!dir || !name) {
      return false
    }
    delete dir.child[name]
    return true
  }

  rename(from: string, to: string) {
    if (this.resolve(from).join('/') === this.resolve(to).join('/')) {
      return true
    }
    const fromDir = fs.track(this.dirname(from), false)
    const fromName = this.basename(from)
    const fromEntry = fs.trackEntry(this.resolve(from))
    const toDir = fs.track(this.dirname(to), false)
    const toName = this.basename(to)
    if (!fromDir || !fromName || !fromEntry || !toDir || !toName) {
      return false
    }
    toDir.child[toName] = fromEntry
    delete fromDir.child[fromName]
    return true
  }

  readdir(path: string, entry?: false): null | string[]
  readdir(path: string, entry: true): null | [name: string, entry: FileEntry | DirEntry][]
  readdir(path: string, entry = false) {
    const dir = this.track(this.resolve(path))
    if (!dir) {
      return null
    }
    if (entry) {
      return Object.entries(dir.child)
    } else {
      return Object.keys(dir.child)
    }
  }

  find(
    path: string,
    file: (path: string, full: string, entry: FileEntry) => void,
    dir: (path: string, full: string, entry: DirEntry) => void
  ) {
    const process = (path: string, current = '') => {
      for (const entry of this.readdir(path, true) ?? []) {
        const subPath = '/' + this.join(path, entry[0])
        const subCurr = this.join(current, entry[0])
        if (entry[1].file) {
          file(subCurr, subPath, entry[1])
        } else {
          dir(subCurr, subPath, entry[1])
          process(subPath, subCurr)
        }
      }
    }
    process(path)
  }

  async findAsync(
    path: string,
    file: (path: string, full: string, entry: FileEntry) => Promise<void>,
    dir: (path: string, full: string, entry: DirEntry) => Promise<void>
  ) {
    const process = async (path: string, current = '') => {
      for (const entry of this.readdir(path, true) ?? []) {
        const subPath = '/' + this.join(path, entry[0])
        const subCurr = this.join(current, entry[0])
        if (entry[1].file) {
          await file(subCurr, subPath, entry[1])
        } else {
          await dir(subCurr, subPath, entry[1])
          await process(subPath, subCurr)
        }
      }
    }
    await process(path)
  }

  readFile(path: string) {
    const entry = this.trackEntry(this.resolve(path))
    if (!entry?.file) {
      return null
    }
    return entry
  }

  // auto detect blob or text
  async writeFile(path: string, content: Blob | Uint8Array) {
    const decoder = new TextDecoder('utf8', { fatal: true })
    try {
      const result = decoder.decode(
        content instanceof Blob ? new Uint8Array(await content.arrayBuffer()) : content
      )
      return this.writeText(path, result)
    } catch (e) {
      return this.writeBlob(path, content)
    }
  }

  writeText(path: string, content: string) {
    const p = this.resolve(path)
    const dir = this.track(this.dirname(p))
    const file = this.basename(p)
    if (!dir || !file) {
      console.warn('writeText cannot resolve', path)
      return false
    }
    dir.child[file] = {
      file: true,
      content
    }
    return true
  }

  writeBlob(path: string, content: Uint8Array | Blob) {
    const p = this.resolve(path)
    const dir = this.track(this.dirname(p))
    const file = this.basename(p)
    if (!dir || !file) {
      console.warn('writeText cannot resolve', path)
      return false
    }
    dir.child[file] = {
      file: true,
      uri: this.blob.make(content)
    }
    return true
  }

  computedText(path: RefLike<string | null>) {
    const fs = this
    return computed<string | null>({
      get() {
        return path.value ? fs.readFile(path.value)?.content ?? null : null
      },
      set(v) {
        if (path.value) {
          fs.writeText(path.value, v ?? '')
        }
      }
    })
  }

  computedJson<T>(path: RefLike<string | null>) {
    const text = this.computedText(path)
    const object = ref<T>({} as T)
    watch(
      text,
      v => {
        try {
          object.value = JSON.parse(v ?? '{}')
        } catch (_) {
          object.value = {} as UnwrapRef<T>
        }
      },
      {
        immediate: true
      }
    )
    watch(
      object,
      v => {
        const result = JSON.stringify(v, null, 2)
        if (result !== text.value) {
          text.value = result
        }
      },
      {
        deep: true
      }
    )
    return object
  }

  async extractZip(reader: zip.ZipReader<unknown>, prefix: string) {
    for (const entry of await reader.getEntries()) {
      const name = this.join(prefix, ...this.resolve(entry.filename))
      if (entry.filename.endsWith('/')) {
        this.mkdir(name)
      } else {
        const writer = new zip.Uint8ArrayWriter()
        const data = await entry.getData?.(writer)
        if (!data) {
          console.warn('read entry', entry, 'failed')
          continue
        }
        await this.writeFile(name, data)
      }
    }
  }

  async loadZip(reader: zip.ZipReader<unknown>) {
    this.reset()
    await this.extractZip(reader, '')
  }

  async makeZip(writer: zip.ZipWriter<unknown>) {
    await this.findAsync(
      '',
      async (path, full, entry) => {
        if ('content' in entry) {
          const reader = new zip.TextReader(entry.content!)
          await writer.add(path, reader)
        } else if (entry.uri) {
          const data = await (await fetch(entry.uri)).blob()
          const reader = new zip.BlobReader(data)
          await writer.add(path, reader)
        }
      },
      async (path, full, entry) => {}
    )
  }

  async extractZipData(data: Blob, at: string) {
    const reader = new zip.BlobReader(data)
    await this.extractZip(new zip.ZipReader(reader), at)
  }

  async loadZipData(data: Blob) {
    const reader = new zip.BlobReader(data)
    await this.loadZip(new zip.ZipReader(reader))
  }

  async makeZipData() {
    const blobWriter = new zip.BlobWriter('application/zip')
    const writer = new zip.ZipWriter(blobWriter, { bufferedWrite: true })
    await this.makeZip(writer)
    await writer.close()
    return await blobWriter.getData()
  }

  async loadFromDB() {
    const data = await db.getFs(this.name)
    if (data) {
      await this.loadZipData(data)
      return true
    } else {
      return false
    }
  }

  async saveToDB() {
    const data = await this.makeZipData()
    await db.putFs(this.name, data)
  }

  startAutoSaving() {
    this.watch = watchDebounced(
      fs,
      () => {
        fs.saveToDB()
      },
      {
        debounce: 1000,
        maxWait: 5000
      }
    )
  }

  stopAutoSaving() {
    const w = this.watch
    this.watch = null
    w?.()
  }

  async switchFs(newName: string) {
    this.stopAutoSaving()
    await this.saveToDB()
    this.reset()
    this.name = newName
    await this.loadFromDB()
  }
}

export const fs = reactive(new MemFS())

fs.loadFromDB()

fs.startAutoSaving()

// @ts-ignore
window.fs = fs

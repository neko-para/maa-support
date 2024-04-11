import * as zip from '@zip.js/zip.js'
import { markRaw, reactive } from 'vue'

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

  make(data: Uint8Array) {
    const url = URL.createObjectURL(new Blob([data]))
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
  root: DirEntry
  blob: BlobManager

  constructor() {
    this.root = {
      child: {}
    }
    this.blob = new BlobManager()
  }

  resolve(path: string) {
    return path.split('/').filter(x => x)
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

  reset() {
    this.root = {
      child: {}
    }
    this.blob.reset()
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
      return res[res.length - 1]
    }
    return null
  }

  mkdir(path: string) {
    return !!this.track(this.resolve(path))
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

  readFile(path: string) {
    const p = this.resolve(path)
    const dir = this.track(this.dirname(p))
    const file = this.basename(p)
    if (!dir || !file || !(file in dir.child)) {
      return null
    }
    if (!dir.child[file].file) {
      return null
    }
    return dir.child[file]
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

  writeBlob(path: string, content: Uint8Array) {
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

  async loadZip(reader: zip.ZipReader<unknown>) {
    const decoder = new TextDecoder('utf8', { fatal: true })
    for (const entry of await reader.getEntries()) {
      if (entry.filename.endsWith('/')) {
        this.mkdir(entry.filename)
      } else {
        const writer = new zip.Uint8ArrayWriter()
        const data = await entry.getData?.(writer)
        if (!data) {
          console.warn('read entry', entry, 'failed')
          continue
        }
        try {
          const result = decoder.decode(data)
          this.writeText(entry.filename, result)
        } catch (e) {
          this.writeBlob(entry.filename, data)
        }
      }
    }
  }
}

export const fs = reactive(new MemFS())

// @ts-ignore
window.fs = fs

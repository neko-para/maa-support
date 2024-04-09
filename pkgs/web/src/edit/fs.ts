import * as zip from '@zip.js/zip.js'
import { markRaw, reactive } from 'vue'

import type { Task } from './types'

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

  dirname(res: string | string[]) {
    if (typeof res === 'string') {
      res = this.resolve(res)
    }
    res.pop()
    return res
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

  writeText(path: string, content: string) {
    let p = this.resolve(path)
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
    let p = this.resolve(path)
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
    const writer = new zip.Uint8ArrayWriter()
    const decoder = new TextDecoder('utf8', { fatal: true })
    for (const entry of await reader.getEntries()) {
      if (entry.filename.endsWith('/')) {
        this.mkdir(entry.filename)
      } else {
        const data = await entry.getData?.(writer)
        if (!data) {
          console.warn('read entry', entry, 'failed')
          break
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

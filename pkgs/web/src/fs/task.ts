import { computed } from 'vue'

import type { Task } from '@/types'

import { fs } from './fs'

type TaskInfo = {
  path: string
  full: string
}

type ImageInfo = {
  path: string
  full: string
  uri: string
}

export const taskInfo = computed(() => {
  const result: Record<string, TaskInfo> = {}
  fs.find(
    '/pipeline',
    (path, full, entry) => {
      if (!path.endsWith('.json') || !entry.content) {
        return
      }
      try {
        const res: Record<string, Task> = JSON.parse(entry.content)
        for (const task in res) {
          if (task.startsWith('$')) {
            continue
          }
          result[task] = {
            path,
            full
          }
        }
      } catch (_) {}
    },
    () => {}
  )
  return result
})

export const imageInfo = computed(() => {
  const result: ImageInfo[] = []
  fs.find(
    '/image',
    (path, full, entry) => {
      if (!path.endsWith('.png') || !entry.uri) {
        return
      }
      result.push({
        path,
        full,
        uri: entry.uri
      })
    },
    () => {}
  )
  return result
})

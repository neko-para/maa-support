import type { TreeOption } from 'naive-ui'
import { computed } from 'vue'

import MIcon from '@/components/MIcon.vue'

import { fs } from './fs'

function build(path: string): TreeOption[] {
  const info = fs.readdir(path, true)
  if (!info) {
    return []
  }
  info.sort((a, b) => {
    return (a[1].file ? 1 : 0) - (b[1].file ? 1 : 0)
  })
  return info.map(([name, entry]) => {
    if (entry.file) {
      return {
        key: path + '/' + name,
        label: name,
        isLeaf: true,
        children: [],
        prefix: () => {
          return (
            <MIcon>
              {name.endsWith('.json') ? 'data_object' : entry.uri ? 'database' : 'article'}{' '}
            </MIcon>
          )
        }
      } satisfies TreeOption
    } else {
      return {
        key: path + '/' + name,
        label: name,
        isLeaf: false,
        children: build(path + '/' + name),
        prefix: () => {
          return <MIcon> folder </MIcon>
        }
      } satisfies TreeOption
    }
  })
}

export const fsData = computed<TreeOption[]>(() => {
  return build('')
})

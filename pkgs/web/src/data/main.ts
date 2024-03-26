import type { AdbConfig } from '@maa/maa'
import { v4 } from 'uuid'
import { reactive, shallowReactive } from 'vue'

type DataMain = {
  name: string
  config: {
    type: 'adb' | 'win32'
    cfg: Partial<
      AdbConfig & {
        hwnd: string
      }
    >
  }
  shallow: {}
}

export const main = reactive({
  data: {} as Record<string, DataMain>,
  ids: [] as string[],

  add: () => {
    const id = v4()
    main.ids.splice(0, 0, id)
    main.data[id] = {
      name: 'untitled',
      config: {
        type: 'adb',
        cfg: {}
      },
      shallow: shallowReactive({})
    }
  }
})

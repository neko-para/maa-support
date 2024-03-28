import type { AdbConfig, Controller, Instance, Resource, TrivialCallback } from '@maa/maa'
import { v4 } from 'uuid'
import { reactive, shallowReactive, watch } from 'vue'

type DataMain = {
  name: string
  config: {
    type: 'adb' | 'win32'
    cfg: Partial<
      AdbConfig & {
        hwnd: string
      }
    >
    path?: string
    task?: string
    param?: string
  }
  shallow: {
    controller?: Controller
    resource?: Resource
    instance?: Instance
  }
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

watch(
  main,
  v => {
    localStorage.setItem(
      'main',
      JSON.stringify(
        {
          data: v.data,
          ids: v.ids
        },
        (k, v) => {
          return k === 'shallow' ? undefined : v
        }
      )
    )
  },
  {
    deep: true
  }
)

if (localStorage.getItem('main')) {
  Object.assign(main, JSON.parse(localStorage.getItem('main') as string))
  for (const id of main.ids) {
    main.data[id].shallow = shallowReactive({})
  }
}

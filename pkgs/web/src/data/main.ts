import type {
  AdbConfig,
  Controller,
  HwndId,
  Instance,
  Resource,
  TrivialCallback,
  Win32Config,
  Win32Type
} from '@maa/maa'
import { v4 } from 'uuid'
import { reactive, shallowReactive, watch } from 'vue'

type DataMain = {
  name: string
  config: {
    controller: {
      ctype?: 'adb' | 'win32'
      adb_cfg?: Partial<AdbConfig>
      win_cfg?: Partial<Win32Config>
      startEntry?: string
      stopEntry?: string
    }
    controllerCache: {
      className?: string
      windowName?: string
      exactMatch?: boolean
    }

    resource: {
      path?: string
    }

    instance: {
      task?: string
      param?: string
    }
  }
  shallow: {
    controller?: Controller
    resource?: Resource
    instance?: Instance

    [rest: symbol]: unknown
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
        controller: {},
        controllerCache: {},
        resource: {},
        instance: {}
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
    main.data[id].name = main.data[id].name ?? 'untitled'
    main.data[id].config = main.data[id].config ?? {
      controller: {},
      controllerCache: {},
      resource: {},
      instance: {}
    }
    main.data[id].config.controller = main.data[id].config.controller ?? {}
    main.data[id].config.controllerCache = main.data[id].config.controllerCache ?? {}
    main.data[id].config.resource = main.data[id].config.resource ?? {}
    main.data[id].config.instance = main.data[id].config.instance ?? {}
    main.data[id].shallow = shallowReactive({})
  }
}

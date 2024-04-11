import {
  type AdbConfig,
  type Controller,
  type Instance,
  type Resource,
  type Win32Config
} from '@nekosu/maa'
import { v4 } from 'uuid'
import { reactive, shallowReactive, watch } from 'vue'

import type { TaskMap } from './core/taskMap'

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
  runtime: {
    taskMap?: TaskMap
  }
  shallow: {
    controller?: Controller
    resource?: Resource
    instance?: Instance

    [rest: symbol]: unknown
  }
}

class MainService {
  data: Record<string, DataMain> = {}
  ids: string[] = []
  active?: string

  constructor() {
    if (localStorage.getItem('main')) {
      Object.assign(this, JSON.parse(localStorage.getItem('main') as string))
      for (const id of this.ids) {
        this.data[id].name = this.data[id].name ?? 'untitled'
        this.data[id].config = this.data[id].config ?? {
          controller: {},
          controllerCache: {},
          resource: {},
          instance: {}
        }
        this.data[id].config.controller = this.data[id].config.controller ?? {}
        this.data[id].config.controllerCache = this.data[id].config.controllerCache ?? {}
        this.data[id].config.resource = this.data[id].config.resource ?? {}
        this.data[id].config.instance = this.data[id].config.instance ?? {}
        this.data[id].runtime = {}
        this.data[id].shallow = shallowReactive({})
      }
    }
  }

  add() {
    const id = v4()
    this.ids.splice(0, 0, id)
    this.data[id] = {
      name: 'untitled',
      config: {
        controller: {},
        controllerCache: {},
        resource: {},
        instance: {}
      },
      runtime: {},
      shallow: shallowReactive({})
    }
  }
}

export const main = reactive(new MainService())

watch(
  main,
  v => {
    localStorage.setItem(
      'main',
      JSON.stringify(
        {
          data: v.data,
          ids: v.ids,
          active: v.active ?? undefined
        },
        (k, v) => {
          return ['runtime', 'shallow'].includes(k) ? undefined : v
        }
      )
    )
  },
  {
    deep: true
  }
)

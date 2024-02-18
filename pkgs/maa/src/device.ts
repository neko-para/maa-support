import { api } from '@maa/schema'

import type { AdbConfig } from './controller'

export interface DeviceInfo extends AdbConfig {
  name: string
}

async function post() {
  return (await api.MaaToolkitPostFindDevice()).return > 0
}

async function postWithAdb(adb_path: string) {
  return (await api.MaaToolkitPostFindDeviceWithAdb({ adb_path })).return > 0
}

async function completed() {
  return (await api.MaaToolkitIsFindDeviceCompleted()).return > 0
}

async function wait() {
  return (await api.MaaToolkitWaitForFindDeviceToComplete()).return
}

async function count() {
  return (await api.MaaToolkitGetDeviceCount()).return
}

async function get(index: number): Promise<DeviceInfo> {
  const info = await Promise.all([
    api.MaaToolkitGetDeviceName({ index }),
    api.MaaToolkitGetDeviceAdbPath({ index }),
    api.MaaToolkitGetDeviceAdbSerial({ index }),
    api.MaaToolkitGetDeviceAdbControllerType({ index }),
    api.MaaToolkitGetDeviceAdbConfig({ index })
  ])
  return {
    name: info[0].return,
    adb_path: info[1].return,
    address: info[2].return,
    type: info[3].return,
    config: info[4].return
  }
}

export const $device = {
  post,
  postWithAdb,
  completed,
  wait,
  count,
  get
}

import { api } from '@maa/schema'

import type { DeviceInfo } from '../types'

export async function findDevice(adb_path?: string) {
  if (
    !(
      (
        await (adb_path
          ? api.MaaToolkitPostFindDeviceWithAdb({ adb_path })
          : api.MaaToolkitPostFindDevice())
      ).return > 0
    )
  ) {
    return null
  }
  if (!((await api.MaaToolkitIsFindDeviceCompleted()).return > 0)) {
    return null
  }
  const count = (await api.MaaToolkitGetDeviceCount()).return
  return await Promise.all(
    Array.from({ length: count }, (_, i) => i).map(async index => {
      return {
        name: (await api.MaaToolkitGetDeviceName({ index })).return,
        adb_path: (await api.MaaToolkitGetDeviceAdbPath({ index })).return,
        address: (await api.MaaToolkitGetDeviceAdbSerial({ index })).return,
        type: (await api.MaaToolkitGetDeviceAdbControllerType({ index })).return,
        config: (await api.MaaToolkitGetDeviceAdbConfig({ index })).return
      } satisfies DeviceInfo as DeviceInfo
    })
  )
}

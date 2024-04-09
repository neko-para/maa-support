import { api } from '../schema'
import type { DeviceInfo } from '../types'

export type HwndId = string & { __kind: 'MaaWin32Hwnd' }

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
  const count = (await api.MaaToolkitWaitForFindDeviceToComplete()).return
  if (!((await api.MaaToolkitIsFindDeviceCompleted()).return > 0)) {
    return null
  }
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

export async function findWindow(option: {
  className?: string
  windowName?: string
  exactMatch?: boolean
}): Promise<HwndId[]> {
  const count = (
    await (option.exactMatch ? api.MaaToolkitFindWindow : api.MaaToolkitSearchWindow)({
      class_name: option.className ?? '',
      window_name: option.windowName ?? ''
    })
  ).return
  return await Promise.all(
    Array.from({ length: count }, (_, i) => i).map(async index => {
      return (await api.MaaToolkitGetWindow({ index })).return as HwndId
    })
  )
}

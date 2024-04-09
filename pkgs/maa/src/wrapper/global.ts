import { api } from '../schema'
import { GlobalOption } from '../types'

export async function version() {
  return (await api.MaaVersion()).return
}

export async function setOption(key: GlobalOption.LogDir, value: string): Promise<boolean>
export async function setOption(
  key: GlobalOption.ShowHitDraw | GlobalOption.DebugMessage,
  value: boolean
): Promise<boolean>
export async function setOption(key: GlobalOption, value: number | string | boolean) {
  switch (key) {
    case GlobalOption.LogDir:
      return (
        (
          await api.MaaSetGlobalOptionString({
            key,
            value: value as string
          })
        ).return > 0
      )
    case GlobalOption.ShowHitDraw:
    case GlobalOption.DebugMessage:
      return (
        (
          await api.MaaSetGlobalOptionBoolean({
            key,
            value: value as boolean
          })
        ).return > 0
      )
  }
  return false
}

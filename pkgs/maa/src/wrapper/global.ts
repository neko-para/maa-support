import { api } from '../schema'
import { GlobalOption, StdoutLevel } from '../types'
import type { ImageHandle, ImageListHandle } from './image'

export async function version() {
  return (await api.MaaVersion()).return
}

export async function setOption(key: GlobalOption.LogDir, value: string): Promise<boolean>
export async function setOption(key: GlobalOption.StdoutLevel, value: StdoutLevel): Promise<boolean>
export async function setOption(
  key:
    | GlobalOption.SaveDraw
    | GlobalOption.Recording
    | GlobalOption.ShowHitDraw
    | GlobalOption.DebugMessage,
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
    case GlobalOption.StdoutLevel:
      return (
        (
          await api.MaaSetGlobalOptionInteger({
            key,
            value: value as number
          })
        ).return > 0
      )
    case GlobalOption.SaveDraw:
    case GlobalOption.Recording:
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

export const globalOption = {
  async setLogDir(value: string) {
    return await setOption(GlobalOption.LogDir, value)
  },
  async setSaveDraw(value: boolean) {
    return await setOption(GlobalOption.SaveDraw, value)
  },
  async setRecording(value: boolean) {
    return await setOption(GlobalOption.Recording, value)
  },
  async setStdoutLevel(value: StdoutLevel) {
    return await setOption(GlobalOption.StdoutLevel, value)
  },
  async setShowHitDraw(value: boolean) {
    return await setOption(GlobalOption.ShowHitDraw, value)
  },
  async setDebugMessage(value: boolean) {
    return await setOption(GlobalOption.DebugMessage, value)
  }
}

export async function queryRecoDetail(reco_id: number, raw: ImageHandle, draws: ImageListHandle) {
  return await api.MaaQueryRecognitionDetail({
    reco_id,
    raw: raw._img!,
    draws: draws._img!
  })
}

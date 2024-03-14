import { api } from '@maa/schema'

import { GlobalOption } from './types'

async function version() {
  return (await api.MaaVersion()).return
}

async function setOptionS(key: GlobalOption.LogDir, value: string) {
  return (await api.MaaSetGlobalOptionString({ key, value })).return > 0
}

async function setOptionB(
  key: GlobalOption.ShowHitDraw | GlobalOption.DebugMessage,
  value: boolean
) {
  return (await api.MaaSetGlobalOptionBoolean({ key, value })).return > 0
}

export const $global = {
  version,
  setOptionS,
  setOptionB
}

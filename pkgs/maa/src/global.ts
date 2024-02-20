import { api } from '@maa/schema'

async function version() {
  return (await api.MaaVersion()).return
}

async function init() {
  return (await api.MaaToolkitInit()).return > 0
}

export const $global = {
  version,
  init
}

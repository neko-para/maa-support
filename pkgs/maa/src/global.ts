import { api } from '@maa/schema'

async function version() {
  return (await api.MaaVersion()).return
}

export const $global = {
  version
}

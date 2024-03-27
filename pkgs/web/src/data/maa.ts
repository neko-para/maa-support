import { deinit, init } from '@maa/maa'
import { reactive } from 'vue'

import { setting } from './setting'

export const maa = reactive({
  active: false,

  async init() {
    if (
      setting.port &&
      (await init(setting.port, () => {
        this.active = false
      }))
    ) {
      this.active = true
      return true
    } else {
      return false
    }
  },

  async deinit() {
    if (this.active && setting.port) {
      this.active = false
      await deinit(setting.port)
      return true
    } else {
      return false
    }
  }
})

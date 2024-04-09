import { GlobalOption, deinit, init, initDirect, setOption } from '@nekosu/maa'
import { reactive } from 'vue'

import { setting } from './setting'

export const maa = reactive({
  active: false,

  async init() {
    if (!setting.port) {
      return false
    }
    if (setting.directSlave) {
      initDirect(setting.port)
      await setOption(GlobalOption.DebugMessage, true)
      this.active = true
      return true
    } else {
      if (
        await init(setting.port, () => {
          this.active = false
        })
      ) {
        await setOption(GlobalOption.DebugMessage, true)
        this.active = true
        return true
      } else {
        return false
      }
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

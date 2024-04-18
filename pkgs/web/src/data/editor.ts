import { reactive } from 'vue'

import { waitNext } from '@/utils/misc'

class DataEditor {
  currentPath: string | null = null
  currentTask: string | null = null
  hideUnset: boolean = false

  reset() {
    this.currentPath = null
    this.currentPath = null
  }

  async switchFile(path: string) {
    this.currentTask = null
    this.currentPath = null
    await waitNext()
    this.currentPath = path
  }
}

export const editor = reactive(new DataEditor())

import { reactive } from 'vue'

class DataEditor {
  currentPath: string | null = null
  currentTask: string | null = null
  hideUnset: boolean = false

  reset() {
    this.currentPath = null
    this.currentPath = null
  }

  switchFile(path: string) {
    this.currentPath = path
    this.currentTask = null
  }
}

export const editor = reactive(new DataEditor())

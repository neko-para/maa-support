import { nextTick } from 'vue'

export function waitNext() {
  return new Promise<void>(resolve => {
    nextTick(resolve)
  })
}

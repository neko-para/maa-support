import { type WritableComputedRef, computed } from 'vue'

export function makeProp<T extends Record<string, unknown>, K extends keyof T>(
  comp: WritableComputedRef<T>,
  key: K
) {
  type V = NonNullable<T[K]>

  return computed<V | null>({
    set(v) {
      const value = { ...comp.value }
      if (v === null) {
        delete value[key]
      } else {
        value[key] = v
      }
      comp.value = value
    },
    get() {
      const value = comp.value
      return key in value ? value[key] ?? null : null
    }
  })
}

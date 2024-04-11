import { computed } from 'vue'

export function makeProp<T extends Record<string, unknown>, K extends keyof T>(
  comp: () => T,
  key: K
) {
  type V = NonNullable<T[K]>

  const getComp = computed(comp)

  return computed<V | null>({
    set(v) {
      if (v === null) {
        delete getComp.value[key]
      } else {
        getComp.value[key] = v
      }
    },
    get() {
      return key in getComp.value ? getComp.value[key] ?? null : null
    }
  })
}

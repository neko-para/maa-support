<script setup lang="ts">
import { NAutoComplete } from 'naive-ui'
import { computed } from 'vue'

import { imageInfo } from '@/fs'

const props = defineProps<{
  value?: string | null
}>()

const emits = defineEmits<{
  'update:value': [string]
}>()

const choices = computed(() => {
  const list = imageInfo.value.map(info => info.path)
  if (!props.value) {
    return list
  }
  const start: string[] = []
  const contain: string[] = []
  const rest: string[] = []
  const key = props.value.toLowerCase()
  for (const image of list) {
    const imageLower = image.toLowerCase()
    if (imageLower.startsWith(key)) {
      start.push(image)
    } else if (imageLower.indexOf(key) !== -1) {
      contain.push(image)
    } else {
      rest.push(image)
    }
  }
  start.sort()
  contain.sort()
  rest.sort()
  return [...start, ...contain, ...rest]
})
</script>

<template>
  <n-auto-complete
    :value="value ?? ''"
    @update:value="v => emits('update:value', v)"
    :options="choices"
    placeholder=""
  ></n-auto-complete>
</template>

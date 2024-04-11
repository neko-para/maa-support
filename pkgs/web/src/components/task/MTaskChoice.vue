<script setup lang="ts">
import { NAutoComplete } from 'naive-ui'
import { computed } from 'vue'

import { taskInfo } from '@/fs'

const props = defineProps<{
  value?: string | null
}>()

const emits = defineEmits<{
  'update:value': [string]
}>()

const choices = computed(() => {
  const list = Object.keys(taskInfo.value)
  if (!props.value) {
    return list
  }
  const start: string[] = []
  const contain: string[] = []
  const rest: string[] = []
  const key = props.value.toLowerCase()
  for (const task of list) {
    const taskLower = task.toLowerCase()
    if (taskLower.startsWith(key)) {
      start.push(task)
    } else if (taskLower.indexOf(key) !== -1) {
      contain.push(task)
    } else {
      rest.push(task)
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

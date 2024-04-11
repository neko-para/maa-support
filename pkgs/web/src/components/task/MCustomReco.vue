<script setup lang="ts">
import { NButton, NInput } from 'naive-ui'
import { ref } from 'vue'

import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

type TaskType = Partial<RestrictWith<Task, 'recognition', 'Custom'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const custom_recognition = make('custom_recognition')
const custom_recognition_param = make('custom_recognition_param')

const cache = ref<string | null>(null)
</script>

<template>
  <n-button @click="custom_recognition = null"> custom_recognition </n-button>
  <n-input v-model:value="custom_recognition" placeholder=""></n-input>
  <n-button @click="custom_recognition_param = null"> custom_recognition_param </n-button>
  <n-input
    :value="cache ?? JSON.stringify(custom_recognition_param, null, 2)"
    @update:value="
      v => {
        try {
          const o = JSON.parse(v)
          cache = null
          custom_recognition_param = o
        } catch (_) {
          cache = v
        }
      }
    "
    placeholder=""
  ></n-input>
</template>

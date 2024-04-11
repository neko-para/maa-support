<script setup lang="ts">
import { NButton, NInput } from 'naive-ui'
import { ref } from 'vue'

import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

type TaskType = Partial<RestrictWith<Task, 'action', 'Custom'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const custom_action = make('custom_action')
const custom_action_param = make('custom_action_param')

const cache = ref<string | null>(null)
</script>

<template>
  <n-button @click="custom_action = null"> custom_action </n-button>
  <n-input v-model:value="custom_action" placeholder=""></n-input>
  <n-button @click="custom_action_param = null"> custom_action_param </n-button>
  <n-input
    :value="cache ?? JSON.stringify(custom_action_param, null, 2)"
    @update:value="
      v => {
        try {
          const o = JSON.parse(v)
          cache = null
          custom_action_param = o
        } catch (_) {
          cache = v
        }
      }
    "
    placeholder=""
  ></n-input>
</template>

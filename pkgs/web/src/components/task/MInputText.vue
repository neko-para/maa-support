<script setup lang="ts">
import { NButton, NInput } from 'naive-ui'

import { editor } from '@/data/editor'
import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

type TaskType = Partial<RestrictWith<Task, 'action', 'InputText'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const input_text = make('input_text')
</script>

<template>
  <template v-if="!editor.hideUnset || 'input_text' in task">
    <n-button @click="input_text = null"> input_text </n-button>
    <n-input v-model:value="input_text" placeholder=""></n-input>
  </template>
</template>

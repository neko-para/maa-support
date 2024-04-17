<script setup lang="ts">
import { NButton, NInput } from 'naive-ui'

import { editor } from '@/data/editor'
import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

type TaskType = Partial<RestrictWith<Task, 'action', 'StartApp' | 'StopApp'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const pkg = make('package')
</script>

<template>
  <template v-if="!editor.hideUnset || 'package' in task">
    <n-button @click="pkg = null"> package </n-button>
    <n-input v-model:value="pkg" placeholder=""></n-input>
  </template>
</template>

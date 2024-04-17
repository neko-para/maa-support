<script setup lang="ts">
import { NButton } from 'naive-ui'

import { editor } from '@/data/editor'
import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

import MRect from './MRect.vue'
import MTarget from './MTarget.vue'

type TaskType = Partial<RestrictWith<Task, 'action', 'Click'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const target = make('target')
const target_offset = make('target_offset')
</script>

<template>
  <template v-if="!editor.hideUnset || 'target' in task">
    <n-button @click="target = null"> target </n-button>
    <m-target v-model:value="target"></m-target>
  </template>
  <template v-if="!editor.hideUnset || 'target_offset' in task">
    <n-button @click="target_offset = null"> target_offset </n-button>
    <m-rect v-model:value="target_offset"></m-rect>
  </template>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'

import { editor } from '@/data/editor'
import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

import { MCharEdit } from './MEdits'
import MMultiEdit from './MMultiEdit.vue'

type TaskType = Partial<RestrictWith<Task, 'action', 'Key'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const key = make('key')
</script>

<template>
  <template v-if="!editor.hideUnset || 'key' in task">
    <n-button @click="key = null"> key </n-button>
    <m-multi-edit
      v-model:value="key"
      :test="v => Array.isArray(v)"
      :def="() => 0"
      :render="MCharEdit"
    ></m-multi-edit>
  </template>
</template>

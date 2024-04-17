<script setup lang="ts">
import { NButton, NInputNumber } from 'naive-ui'

import { editor } from '@/data/editor'
import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

import MRect from './MRect.vue'
import MTarget from './MTarget.vue'

type TaskType = Partial<RestrictWith<Task, 'action', 'Swipe'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const begin = make('begin')
const begin_offset = make('begin_offset')
const end = make('end')
const end_offset = make('end_offset')
const duration = make('duration')
</script>

<template>
  <template v-if="!editor.hideUnset || 'begin' in task">
    <n-button @click="begin = null"> begin </n-button>
    <m-target v-model:value="begin"></m-target>
  </template>
  <template v-if="!editor.hideUnset || 'begin_offset' in task">
    <n-button @click="begin_offset = null"> begin_offset </n-button>
    <m-rect v-model:value="begin_offset"></m-rect>
  </template>
  <template v-if="!editor.hideUnset || 'end' in task">
    <n-button @click="end = null"> end </n-button>
    <m-target v-model:value="end"></m-target>
  </template>
  <template v-if="!editor.hideUnset || 'end_offset' in task">
    <n-button @click="end_offset = null"> end_offset </n-button>
    <m-rect v-model:value="end_offset"></m-rect>
  </template>
  <template v-if="!editor.hideUnset || 'duration' in task">
    <n-button @click="duration = null"> duration </n-button>
    <n-input-number v-model:value="duration" placeholder="">
      <template #suffix>
        <span> ms </span>
      </template>
    </n-input-number>
  </template>
</template>

<script setup lang="ts">
import { NButton, NSelect } from 'naive-ui'
import { computed } from 'vue'

import type { Task } from '@/types'
import { makeProp } from '@/utils/property'

import MColorMatch from './task/MColorMatch.vue'
import MFeatureMatch from './task/MFeatureMatch.vue'
import MTemplateMatch from './task/MTemplateMatch.vue'

type TaskType = Partial<Task>

const props = defineProps<{
  task: TaskType
}>()

const emits = defineEmits<{
  'update:task': [TaskType]
}>()

const task = computed<TaskType>({
  set(v) {
    emits('update:task', v)
  },
  get() {
    return props.task
  }
})

function make<K extends keyof TaskType>(key: K) {
  return makeProp(task, key)
}

const recognitionOptions = [
  'DirectHit',
  'TemplateMatch',
  'FeatureMatch',
  'ColorMatch',
  'OCR',
  'NeuralNetworkClassify',
  'NeuralNetworkDetect',
  'Custom'
].map(x => ({
  label: x,
  value: x
}))

const actionOptions = [
  'DoNothing',
  'Click',
  'Swipe',
  'Key',
  'Text',
  'StartApp',
  'StopApp',
  'StopTask',
  'Custom'
].map(x => ({
  label: x,
  value: x
}))

const recognition = make('recognition')
const action = make('action')
</script>

<template>
  <div class="maa-form">
    <n-button @click="recognition = null"> recognition </n-button>
    <n-select v-model:value="recognition" :options="recognitionOptions" placeholder=""></n-select>

    <template v-if="task.recognition === 'TemplateMatch'">
      <m-template-match v-model:task="task"></m-template-match>
    </template>
    <template v-else-if="task.recognition === 'FeatureMatch'">
      <m-feature-match v-model:task="task"></m-feature-match>
    </template>
    <template v-else-if="task.recognition === 'ColorMatch'">
      <m-color-match v-model:task="task"></m-color-match>
    </template>

    <n-button @click="action = null"> action </n-button>
    <n-select v-model:value="action" :options="actionOptions" placeholder=""></n-select>
  </div>
</template>

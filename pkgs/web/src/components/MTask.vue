<script setup lang="ts">
import { NButton, NSelect } from 'naive-ui'
import { computed } from 'vue'

import type { Task } from '@/types'
import { makeProp } from '@/utils/property'

import MColorMatch from './task/MColorMatch.vue'
import MCustomAction from './task/MCustomAction.vue'
import MCustomReco from './task/MCustomReco.vue'
import { MNextEdit } from './task/MEdits'
import MFeatureMatch from './task/MFeatureMatch.vue'
import MMultiEdit from './task/MMultiEdit.vue'
import MOcr from './task/MOcr.vue'
import MTemplateMatch from './task/MTemplateMatch.vue'

type TaskType = Partial<Task>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
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
const next = make('next')
</script>

<template>
  <div class="maa-form">
    <n-button @click="recognition = null"> recognition </n-button>
    <n-select v-model:value="recognition" :options="recognitionOptions" placeholder=""></n-select>

    <template v-if="task.recognition === 'TemplateMatch'">
      <m-template-match :task="task"></m-template-match>
    </template>
    <template v-else-if="task.recognition === 'FeatureMatch'">
      <m-feature-match :task="task"></m-feature-match>
    </template>
    <template v-else-if="task.recognition === 'ColorMatch'">
      <m-color-match :task="task"></m-color-match>
    </template>
    <template v-else-if="task.recognition === 'OCR'">
      <m-ocr :task="task"></m-ocr>
    </template>
    <template v-else-if="task.recognition === 'Custom'">
      <m-custom-reco :task="task"></m-custom-reco>
    </template>

    <n-button @click="action = null"> action </n-button>
    <n-select v-model:value="action" :options="actionOptions" placeholder=""></n-select>

    <template v-if="task.action === 'Custom'">
      <m-custom-action :task="task"></m-custom-action>
    </template>

    <n-button @click="next = null"> next </n-button>
    <m-multi-edit
      v-model:value="next"
      :test="v => Array.isArray(v)"
      :def="() => ''"
      :render="MNextEdit"
    ></m-multi-edit>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInputNumber, NSelect, NSwitch } from 'naive-ui'

import { editor } from '@/data/editor'
import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

import { MRectEdit, MTemplateEdit } from './MEdits'
import MMultiEdit from './MMultiEdit.vue'

type TaskType = Partial<RestrictWith<Task, 'recognition', 'FeatureMatch'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const orderByOptions = ['Horizontal', 'Vertical', 'Score', 'Area', 'Random'].map(x => ({
  label: x,
  value: x
}))

const detectorOptions = ['SIFT', 'KAZE', 'AKAZE', 'BRISK', 'ORB'].map(x => ({
  label: x,
  value: x
}))

const roi = make('roi')
const template = make('template')
const count = make('count')
const orderBy = make('order_by')
const index = make('index')
const green_mask = make('green_mask')
const detector = make('detector')
const ratio = make('ratio')
</script>

<template>
  <template v-if="!editor.hideUnset || 'roi' in task">
    <n-button @click="roi = null"> roi </n-button>
    <m-multi-edit
      v-model:value="roi"
      :test="v => v.length !== 4 || typeof v[0] !== 'number'"
      :def="() => [0, 0, 0, 0]"
      :render="MRectEdit"
    ></m-multi-edit>
  </template>
  <template v-if="!editor.hideUnset || 'template' in task">
    <n-button @click="template = null"> template </n-button>
    <m-multi-edit
      v-model:value="template"
      :test="v => Array.isArray(v)"
      :def="() => ''"
      :render="MTemplateEdit"
    ></m-multi-edit>
  </template>
  <template v-if="!editor.hideUnset || 'count' in task">
    <n-button @click="count = null"> count </n-button>
    <n-input-number
      v-model:value="count"
      placeholder=""
      :min="0"
      :parse="v => parseInt(v) ?? null"
      :show-button="false"
    ></n-input-number>
  </template>
  <template v-if="!editor.hideUnset || 'orderBy' in task">
    <n-button @click="orderBy = null"> orderBy </n-button>
    <n-select v-model:value="orderBy" :options="orderByOptions" placeholder=""></n-select>
  </template>
  <template v-if="!editor.hideUnset || 'index' in task">
    <n-button @click="index = null"> index </n-button>
    <n-input-number
      v-model:value="index"
      placeholder=""
      :min="0"
      :parse="v => parseInt(v) ?? null"
      :show-button="false"
    ></n-input-number>
  </template>
  <template v-if="!editor.hideUnset || 'green_mask' in task">
    <n-button @click="green_mask = null"> green_mask </n-button>
    <div>
      <n-switch
        :value="green_mask ?? false"
        @update:value="
          v => {
            green_mask = !!v
          }
        "
      ></n-switch>
    </div>
  </template>
  <template v-if="!editor.hideUnset || 'detector' in task">
    <n-button @click="detector = null"> detector </n-button>
    <n-select v-model:value="detector" :options="detectorOptions" placeholder=""></n-select>
  </template>
  <template v-if="!editor.hideUnset || 'ratio' in task">
    <n-button @click="ratio = null"> ratio </n-button>
    <n-input-number
      v-model:value="ratio"
      placeholder=""
      :min="0"
      :max="1"
      :show-button="false"
    ></n-input-number>
  </template>
</template>

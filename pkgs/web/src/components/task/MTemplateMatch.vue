<script setup lang="ts">
import { NButton, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import { computed } from 'vue'

import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

import { MRectEdit, MStringEdit, MThresholdEdit } from './MEdits'
import MMultiEdit from './MMultiEdit.vue'

type TaskType = Partial<RestrictWith<Task, 'recognition', 'TemplateMatch'>>

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

const orderByOptions = ['Horizontal', 'Vertical', 'Score', 'Random'].map(x => ({
  label: x,
  value: x
}))

const methodOptions = [1, 3, 5].map(x => ({
  label: `${x}`,
  value: x
}))

const roi = make('roi')
const template = make('template')
const threshold = make('threshold')
const orderBy = make('order_by')
const index = make('index')
const method = make('method')
const green_mask = make('green_mask')
</script>

<template>
  <n-button @click="roi = null"> roi </n-button>
  <m-multi-edit
    v-model:value="roi"
    :test="v => v.length !== 4 || typeof v[0] !== 'number'"
    :def="() => [0, 0, 0, 0]"
    :render="MRectEdit"
  ></m-multi-edit>
  <n-button @click="template = null"> template </n-button>
  <m-multi-edit
    v-model:value="template"
    :test="v => Array.isArray(v)"
    :def="() => ''"
    :render="MStringEdit"
  ></m-multi-edit>
  <n-button @click="threshold = null"> threshold </n-button>
  <m-multi-edit
    v-model:value="threshold"
    :test="v => Array.isArray(v)"
    :def="() => 0.7"
    :render="MThresholdEdit"
  ></m-multi-edit>
  <n-button @click="orderBy = null"> orderBy </n-button>
  <n-select v-model:value="orderBy" :options="orderByOptions" placeholder=""></n-select>
  <n-button @click="index = null"> index </n-button>
  <n-input-number
    v-model:value="index"
    placeholder=""
    :min="0"
    :parse="v => parseInt(v) ?? null"
    :show-button="false"
  ></n-input-number>
  <n-button @click="method = null"> method </n-button>
  <n-select v-model:value="method" :options="methodOptions" placeholder=""></n-select>
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

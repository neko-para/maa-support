<script setup lang="ts">
import { NButton, NInput, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import { computed } from 'vue'

import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

import { MRectEdit, MReplaceEdit, MStringEdit } from './MEdits'
import MMultiEdit from './MMultiEdit.vue'

type TaskType = Partial<RestrictWith<Task, 'recognition', 'OCR'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const orderByOptions = ['Horizontal', 'Vertical', 'Score', 'Random'].map(x => ({
  label: x,
  value: x
}))

const roi = make('roi')
const text = make('text')
const replace = make('replace')
const orderBy = make('order_by')
const index = make('index')
const only_rec = make('only_rec')
const model = make('model')
</script>

<template>
  <n-button @click="roi = null"> roi </n-button>
  <m-multi-edit
    v-model:value="roi"
    :test="v => v.length !== 4 || typeof v[0] !== 'number'"
    :def="() => [0, 0, 0, 0]"
    :render="MRectEdit"
  ></m-multi-edit>
  <n-button @click="text = null"> text </n-button>
  <m-multi-edit
    v-model:value="text"
    :test="v => Array.isArray(v)"
    :def="() => ''"
    :render="MStringEdit"
  ></m-multi-edit>
  <n-button @click="replace = null"> replace </n-button>
  <m-multi-edit
    v-model:value="replace"
    :test="v => Array.isArray(v)"
    :def="() => ['', '']"
    :render="MReplaceEdit"
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
  <n-button @click="only_rec = null"> only_rec </n-button>
  <div>
    <n-switch
      :value="only_rec ?? false"
      @update:value="
        v => {
          only_rec = !!v
        }
      "
    ></n-switch>
  </div>
  <n-button @click="model = null"> model </n-button>
  <n-input v-model="model" placeholder=""></n-input>
</template>

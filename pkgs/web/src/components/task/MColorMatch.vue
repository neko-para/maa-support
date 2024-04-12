<script setup lang="ts">
import { NButton, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import { computed, nextTick, watch } from 'vue'

import type { RestrictWith, Task } from '@/types'
import { makeProp } from '@/utils/property'

import { MGrayEdit, MHSVEdit, MRGBEdit, MRectEdit } from './MEdits'
import MMultiEdit from './MMultiEdit.vue'

type TaskType = Partial<RestrictWith<Task, 'recognition', 'ColorMatch'>>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const methodOptions = [4, 40, 6].map(x => ({
  label: `${x}`,
  value: x
}))

const orderByOptions = ['Horizontal', 'Vertical', 'Score', 'Area', 'Random'].map(x => ({
  label: x,
  value: x
}))

const roi = make('roi')
const method = make('method')
const lower = make('lower')
const upper = make('upper')
const count = make('count')
const orderBy = make('order_by')
const index = make('index')
const connected = make('connected')

watch(
  () => method.value,
  () => {
    nextTick(() => {
      lower.value = null
      nextTick(() => {
        upper.value = null
      })
    })
  }
)
</script>

<template>
  <n-button @click="roi = null"> roi </n-button>
  <m-multi-edit
    v-model:value="roi"
    :test="v => v.length !== 4 || typeof v[0] !== 'number'"
    :def="() => [0, 0, 0, 0]"
    :render="MRectEdit"
  ></m-multi-edit>
  <n-button @click="method = null"> method </n-button>
  <n-select v-model:value="method" :options="methodOptions" placeholder=""></n-select>
  <n-button @click="lower = null"> lower </n-button>
  <m-multi-edit
    v-if="!method || method === 4"
    :value="lower as [number, number, number][]"
    @update:value="v => (lower = v)"
    :test="v => v.length !== 3 || typeof v[0] !== 'number'"
    :def="() => [0, 0, 0]"
    :render="MRGBEdit"
  ></m-multi-edit>
  <m-multi-edit
    v-else-if="method === 40"
    :value="lower as [number, number, number][]"
    @update:value="v => (lower = v)"
    :test="v => v.length !== 3 || typeof v[0] !== 'number'"
    :def="() => [0, 0, 0]"
    :render="MHSVEdit"
  ></m-multi-edit>
  <m-multi-edit
    v-else-if="method === 6"
    :value="lower as [number][]"
    @update:value="v => (lower = v)"
    :test="v => v.length !== 1 || typeof v[0] !== 'number'"
    :def="() => [0]"
    :render="MGrayEdit"
  ></m-multi-edit>
  <span v-else> unknown method {{ method }} </span>
  <n-button @click="upper = null"> upper </n-button>
  <m-multi-edit
    v-if="!method || method === 4"
    :value="upper as [number, number, number][]"
    @update:value="v => (upper = v)"
    :test="v => v.length !== 3 || typeof v[0] !== 'number'"
    :def="() => [0, 0, 0]"
    :render="MRGBEdit"
  ></m-multi-edit>
  <m-multi-edit
    v-else-if="method === 40"
    :value="upper as [number, number, number][]"
    @update:value="v => (upper = v)"
    :test="v => v.length !== 3 || typeof v[0] !== 'number'"
    :def="() => [0, 0, 0]"
    :render="MHSVEdit"
  ></m-multi-edit>
  <m-multi-edit
    v-else-if="method === 6"
    :value="upper as [number][]"
    @update:value="v => (upper = v)"
    :test="v => v.length !== 1 || typeof v[0] !== 'number'"
    :def="() => [0]"
    :render="MGrayEdit"
  ></m-multi-edit>
  <span v-else> unknown method {{ method }} </span>
  <n-button @click="count = null"> count </n-button>
  <n-input-number
    v-model:value="count"
    placeholder=""
    :min="0"
    :parse="v => parseInt(v) ?? null"
    :show-button="false"
  ></n-input-number>
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
  <n-button @click="connected = null"> connected </n-button>
  <div>
    <n-switch
      :value="connected ?? false"
      @update:value="
        v => {
          connected = !!v
        }
      "
    ></n-switch>
  </div>
</template>

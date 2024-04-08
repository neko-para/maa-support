<script setup lang="ts">
import { NButton, NInput } from 'naive-ui'

import type { ITemplateInterface } from './ITemplate'

const props = defineProps<{
  intf: ITemplateInterface
  modelValue: string[] | undefined
}>()

const emits = defineEmits<{
  'update:modelValue': [string[] | undefined]
}>()

function addEntry() {
  emits('update:modelValue', [...(props.modelValue ?? []), ''])
}

function clearEntry() {
  emits(
    'update:modelValue',
    (props.modelValue ?? []).filter(x => x)
  )
}
</script>

<template>
  <div class="flex gap-2m-0.5">
    <n-button @click="emits('update:modelValue', undefined)"> {{ intf.name }} </n-button>
    <div class="flex flex-col gap-2">
      <div class="flex gap-2">
        <n-button @click="addEntry"> add </n-button>
        <n-button @click="clearEntry"> clear </n-button>
      </div>
      <template v-if="props.modelValue">
        <n-input
          v-for="(t, i) in props.modelValue"
          :key="i"
          :value="t"
          @update:value="
            v => {
              const res = [...(props.modelValue ?? [])]
              res[i] = v
              emits('update:modelValue', res)
            }
          "
          placeholder=""
        ></n-input>
      </template>
    </div>
  </div>
</template>

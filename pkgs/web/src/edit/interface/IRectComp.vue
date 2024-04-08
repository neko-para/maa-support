<script setup lang="ts">
import { NButton, NInputNumber } from 'naive-ui'

import type { Rect } from '../types'
import type { IRectInterface } from './IRect'

const props = defineProps<{
  intf: IRectInterface
  modelValue: Rect | undefined
}>()

const emits = defineEmits<{
  'update:modelValue': [Rect | undefined]
}>()

const prefix = ['x', 'y', 'w', 'h']
</script>

<template>
  <div class="flex gap-2 items-center m-0.5">
    <n-button @click="emits('update:modelValue', undefined)"> {{ intf.name }} </n-button>
    <div class="grid grid-cols-4 gap-2">
      <n-input-number
        v-for="k in 4"
        :key="k"
        :value="props.modelValue?.[k - 1] ?? null"
        @update:value="
          v => {
            const val = props.modelValue ?? [0, 0, 0, 0]
            val[k - 1] = v ?? 0
            emits('update:modelValue', val)
          }
        "
        :show-button="false"
        :placeholder="prefix[k - 1]"
      ></n-input-number>
    </div>
  </div>
</template>

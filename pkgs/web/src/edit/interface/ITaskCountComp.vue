<script setup lang="ts">
import { NButton, NInputNumber } from 'naive-ui'

import type { ITaskCountInterface } from './ITaskCount'

const props = defineProps<{
  intf: ITaskCountInterface
  modelValue: number
}>()

const emits = defineEmits<{
  'update:modelValue': [number]
}>()
</script>

<template>
  <div class="flex gap-2 items-center m-0.5">
    <n-button @click="emits('update:modelValue', 0)"> {{ intf.name }} </n-button>
    <n-input-number
      min="0"
      :value="props.modelValue ?? null"
      @update:value="
        v => {
          emits('update:modelValue', v ?? 0)
        }
      "
    ></n-input-number>
  </div>
</template>

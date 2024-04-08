<script setup lang="ts">
import { NButton, NSwitch } from 'naive-ui'

import type { ICheckInterface } from './ICheck'

const props = defineProps<{
  intf: ICheckInterface
  modelValue: boolean | undefined
}>()

const emits = defineEmits<{
  'update:modelValue': [boolean | undefined]
}>()
</script>

<template>
  <div class="flex gap-2 items-center m-0.5">
    <n-button @click="emits('update:modelValue', undefined)"> {{ intf.name }} </n-button>
    <n-switch
      :value="props.modelValue ?? false"
      @update:value="
        v => {
          emits('update:modelValue', v ?? undefined)
        }
      "
    ></n-switch>
  </div>
</template>

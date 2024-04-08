<script setup lang="ts" generic="KeySet extends string">
import { NButton, NSelect } from 'naive-ui'
import type { ISelectInterface } from './ISelect'

const props = defineProps<{
  intf: ISelectInterface<KeySet>
  modelValue: KeySet | undefined
}>()

const emits = defineEmits<{
  'update:modelValue': [KeySet | undefined]
}>()
</script>

<template>
  <div class="flex gap-2 items-center m-0.5">
    <n-button @click="emits('update:modelValue', undefined)"> {{ intf.name }} </n-button>
    <n-select
      :value="props.modelValue ?? null"
      @update:value="v => emits('update:modelValue', v)"
      :options="intf.options.map(k => ({ label: k, value: k }))"
      :placeholder="intf.defaultValue"
    ></n-select>
  </div>
</template>

<script setup lang="ts">
import { NInputNumber } from 'naive-ui'

defineProps<{
  len: number
  value: number[]
  prefix: string[]
  button?: boolean
}>()

const emits = defineEmits<{
  'update:value': [number[]]
}>()
</script>

<template>
  <div class="flex gap-2">
    <n-input-number
      v-for="i in len"
      :key="i"
      :show-button="!!button"
      placeholder=""
      :value="value[i - 1]"
      @update:value="
        v => {
          const res = [...value]
          res[i - 1] = v ?? 0
          emits('update:value', res)
        }
      "
    >
      <template #prefix>
        <span> {{ prefix[i - 1] }}: </span>
      </template>
    </n-input-number>
  </div>
</template>

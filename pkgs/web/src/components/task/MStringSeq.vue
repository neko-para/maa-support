<script setup lang="ts">
import { NInput } from 'naive-ui'

defineProps<{
  len: number
  value: string[]
  prefix: string[]
}>()

const emits = defineEmits<{
  'update:value': [string[]]
}>()
</script>

<template>
  <div class="flex gap-2">
    <n-input
      v-for="i in len"
      :key="i"
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
    </n-input>
  </div>
</template>

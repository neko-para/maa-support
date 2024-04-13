<script setup lang="ts">
import { NInput, NRadio, NSwitch } from 'naive-ui'

import type { Rect } from '@/types'

defineProps<{
  // https://github.com/vuejs/vue/issues/11367
  // boolean should be after string to preserve empty prop
  value?: string | true | Rect
}>()

defineEmits<{
  'update:value': [string | true | Rect]
}>()
</script>

<template>
  <div>
    <n-switch></n-switch>
  </div>
</template>

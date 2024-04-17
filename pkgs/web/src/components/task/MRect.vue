<script setup lang="ts">
import type { Rect } from '@/types'

import MNumberSeq from './MNumberSeq.vue'

defineProps<{
  value: Rect | null
}>()

const emits = defineEmits<{
  'update:value': [Rect]
}>()
</script>

<template>
  <m-number-seq
    :len="4"
    :prefix="['X', 'Y', 'Width', 'Height']"
    :value="value ?? [0, 0, 0, 0]"
    @update:value="v => emits('update:value', v as Rect)"
  ></m-number-seq>
</template>

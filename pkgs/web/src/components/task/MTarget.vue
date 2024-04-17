<script setup lang="ts">
import { NInput, NRadio, NRadioGroup, NSwitch, c } from 'naive-ui'
import { computed } from 'vue'

import type { Rect } from '@/types'

import MRect from './MRect.vue'
import MTaskChoice from './MTaskChoice.vue'

const props = defineProps<{
  // https://github.com/vuejs/vue/issues/11367
  // boolean should be after string to preserve empty prop
  value: string | true | Rect | null
}>()

const emits = defineEmits<{
  'update:value': [string | true | Rect]
}>()

const type = computed<0 | 1 | 2>({
  set(v) {
    switch (v) {
      case 0:
        emits('update:value', true)
        break
      case 1:
        emits('update:value', stringValue.value)
        break
      case 2:
        emits('update:value', rectValue.value)
        break
    }
  },
  get() {
    if (props.value === null || props.value === true) {
      return 0
    } else if (typeof props.value === 'string') {
      return 1
    } else {
      return 2
    }
  }
})

const stringValue = computed(() => {
  return typeof props.value === 'string' ? props.value : ''
})
const rectValue = computed<Rect>(() => {
  return Array.isArray(props.value) ? props.value : [0, 0, 0, 0]
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <n-radio-group v-model:value="type">
      <n-radio :key="0" :value="0"> default </n-radio>
      <n-radio :key="1" :value="1"> task </n-radio>
      <n-radio :key="2" :value="2"> roi </n-radio>
    </n-radio-group>

    <m-task-choice
      v-if="type === 1"
      :value="stringValue"
      @update:value="v => emits('update:value', v)"
    ></m-task-choice>
    <m-rect
      v-if="type === 2"
      :value="rectValue"
      @update:value="v => emits('update:value', v)"
    ></m-rect>
  </div>
</template>

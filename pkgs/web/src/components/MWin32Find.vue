<script setup lang="ts">
import { type HwndId, findWindow } from '@nekosu/maa'
import { NCard, NInput, NSwitch } from 'naive-ui'

const props = defineProps<{
  className?: string
  windowName?: string
  exactMatch?: boolean
}>()

defineEmits<{
  'update:className': [string]
  'update:windowName': [string]
  'update:exactMatch': [boolean]
}>()

async function performScan() {
  return await findWindow(props)
}

defineExpose({
  performScan
})
</script>

<template>
  <n-card>
    <div class="flex flex-col gap-2">
      <div class="maa-form grid-rows-3">
        <span> class name </span>
        <n-input
          :value="className"
          @update:value="$emit('update:className', $event)"
          placeholder=""
        ></n-input>
        <span> window name </span>
        <n-input
          :value="windowName"
          @update:value="$emit('update:windowName', $event)"
          placeholder=""
        ></n-input>
        <span> exact match </span>
        <div>
          <n-switch
            :value="exactMatch"
            @update:value="$emit('update:exactMatch', $event)"
          ></n-switch>
        </div>
      </div>
    </div>
  </n-card>
</template>

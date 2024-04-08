<script setup lang="ts">
import { NButton } from 'naive-ui'

import type { ITaskInterface } from './ITask'

const props = defineProps<{
  intf: ITaskInterface
  modelValue: string
}>()
</script>

<template>
  <div class="flex gap-2 items-center m-0.5">
    <n-button disabled> {{ intf.name }} </n-button>
  </div>
</template>

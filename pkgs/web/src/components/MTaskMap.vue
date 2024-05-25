<script setup lang="ts">
import { ImageListHandle, awaitUsing, queryRecoDetail } from '@nekosu/maa'
import { instance } from '@viz-js/viz'
import { NCard, NCode, NModal } from 'naive-ui'
import { ref } from 'vue'

import { taskInfo } from '@/fs'
import type { Rect } from '@/types'

const showModal = ref(false)

const svgHolderEl = ref<HTMLDivElement | null>(null)

async function showTaskMap() {
  showModal.value = true
  const viz = await instance()
  const edges: string[] = []
  for (const name in taskInfo.value) {
    const task = taskInfo.value[name].task
    for (const next of task.next ?? []) {
      edges.push(`${JSON.stringify(name)} -> ${JSON.stringify(next)}`)
    }
  }
  const graph = `digraph { ${edges.join(';')} }`
  const el = viz.renderSVGElement(graph)
  svgHolderEl?.value?.appendChild(el)
}

defineExpose({
  showTaskMap
})
</script>

<template>
  <n-modal v-model:show="showModal">
    <div
      ref="svgHolderEl"
      style="max-width: 90vw; margin-top: 5vh; max-height: 90vh; overflow: auto"
    ></div>
  </n-modal>
</template>

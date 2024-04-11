<script setup lang="ts">
import * as zip from '@zip.js/zip.js'
import { NButton, NCode, NConfigProvider, NSelect, NSplit, NTree } from 'naive-ui'
import type { TreeNodeProps } from 'naive-ui/es/tree/src/interface'
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'

import MIcon from '@/components/MIcon.vue'
import MTask from '@/components/MTask.vue'
import { fs, fsData, imageInfo, taskInfo } from '@/fs'
import type { Task } from '@/types'

const selectZipEl = ref<HTMLInputElement | null>(null)
const selectedFile = shallowRef<File | null>(null)
let selectResolve = () => {}

onMounted(() => {
  selectZipEl.value!.addEventListener('change', event => {
    selectedFile.value = (event.target as HTMLInputElement)?.files?.[0] ?? null
    selectZipEl.value!.value = ''
    selectResolve()
  })
})

function uploadZip() {
  selectResolve = () => {}
  selectZipEl.value?.click()
  new Promise<void>(resolve => {
    selectResolve = resolve
  }).then(async () => {
    if (!selectedFile.value) {
      return
    }
    const file = selectedFile.value
    const reader = new zip.BlobReader(file)
    taskPath.value = null
    taskData.value = {}
    currentTask.value = null
    fs.reset()
    await fs.loadZip(new zip.ZipReader(reader))
  })
}

const taskPath = ref<string | null>(null)
const taskData = ref<Record<string, Partial<Task>>>({})
const currentTask = ref<string | null>(null)
const task = computed(() => {
  if (!currentTask.value) {
    return null
  }
  return taskData.value[currentTask.value]
})

const nodeProps: TreeNodeProps = ({ option }) => {
  return {
    onClick(payload) {
      const path = option.key
      if (!path || typeof path !== 'string') {
        return
      }
      if (path.endsWith('.json') && path.startsWith('/pipeline/')) {
        const entry = fs.readFile(path)
        if (!entry || entry.content === undefined) {
          return
        }
        taskPath.value = path
        taskData.value = JSON.parse(entry.content)
        currentTask.value = null
        return
      }
    }
  }
}

const taskListOpts = computed(() => {
  return Object.keys(taskData.value)
    .filter(x => !x.startsWith('$'))
    .map(name => ({
      label: name,
      value: name
    }))
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <input ref="selectZipEl" type="file" accept=".zip" class="hidden" />

    <n-split :min="0.1" :max="0.3" :default-size="0.2">
      <template #1>
        <div class="flex flex-col gap-2">
          <div class="flex gap-2 p-2">
            <n-button @click="uploadZip"> 导入 </n-button>
            <!-- <n-button @click="exportGraph"> 导出 </n-button> -->
          </div>
          <n-tree :data="fsData" expand-on-click :node-props="nodeProps"></n-tree>
        </div>
      </template>
      <template #2>
        <div class="container mx-auto pt-4 flex flex-col gap-4">
          <div class="flex items-center gap-2">
            <span> {{ taskPath }} </span>
            <n-select v-model:value="currentTask" :options="taskListOpts" placeholder=""></n-select>
          </div>
          <m-task v-if="task" :task="task"></m-task>
          <n-code :code="JSON.stringify(task, null, 2)" language="json"></n-code>
        </div>
        {{ taskInfo }}
        {{ imageInfo }}
      </template>
    </n-split>
  </div>
</template>

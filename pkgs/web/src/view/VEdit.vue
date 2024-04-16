<script setup lang="ts">
import { NButton, NCode, NSelect, NSplit } from 'naive-ui'
import { computed } from 'vue'

import MCrop from '@/components/MCrop.vue'
import MExplorer from '@/components/MExplorer.vue'
import MIcon from '@/components/MIcon.vue'
import MTask from '@/components/MTask.vue'
import { editor } from '@/data/editor'
import { fs, taskInfo } from '@/fs'
import type { Task } from '@/types'

const taskData = fs.computedJson<Partial<Record<string, Task>>>(computed(() => editor.currentPath))
const task = computed(() => {
  if (!editor.currentTask || !taskData.value) {
    return null
  }
  return taskData.value[editor.currentTask]
})

const taskListOpts = computed(() => {
  return Object.keys(taskData.value)
    .filter(x => !x.startsWith('$'))
    .map(name => ({
      label: name,
      value: name
    }))
})

function addTask() {
  let name: string
  for (let i = 0; ; i++) {
    name = `untitled_${i}`
    if (!(name in taskInfo.value)) {
      break
    }
  }
  taskData.value[name] = {}
}

function renameTask() {}
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <n-split :min="0.1" :max="0.3" :default-size="0.2">
      <template #1>
        <m-explorer></m-explorer>
      </template>
      <template #2>
        <div class="container mx-auto p-4 flex flex-col gap-4 h-full">
          <div class="flex items-center gap-2" v-if="editor.currentPath">
            <span> {{ editor.currentPath }} </span>
            <n-button @click="addTask" text>
              <m-icon> add </m-icon>
            </n-button>
            <n-button @click="renameTask" text :disabled="!editor.currentTask">
              <m-icon> edit </m-icon>
            </n-button>
            <n-select
              v-model:value="editor.currentTask"
              :options="taskListOpts"
              placeholder=""
            ></n-select>
          </div>
          <m-task v-if="task" :task="task"></m-task>
          <n-code v-if="task" :code="JSON.stringify(task, null, 2)" language="json"></n-code>
          <div class="flex flex-col flex-1 gap-2">
            <m-crop ref="cropEl"></m-crop>
          </div>
        </div>
      </template>
    </n-split>
  </div>
</template>

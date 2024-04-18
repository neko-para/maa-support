<script setup lang="ts">
import { NButton, NCode, NSelect, NSplit, NSwitch, useDialog } from 'naive-ui'
import { computed, nextTick } from 'vue'

import MCrop from '@/components/MCrop.vue'
import MExplorer from '@/components/MExplorer.vue'
import MIcon from '@/components/MIcon.vue'
import MTask from '@/components/MTask.vue'
import { editor } from '@/data/editor'
import { fs, taskInfo } from '@/fs'
import type { Task } from '@/types'
import { requestInput } from '@/utils/input'

const taskData = fs.computedJson<Partial<Record<string, Task>>>(computed(() => editor.currentPath))
const task = computed(() => {
  if (!editor.currentTask || !taskData.value) {
    return null
  }
  return taskData.value[editor.currentTask]
})
const previewImage = computed<string | null>(() => {
  if (!editor.currentPath) {
    return null
  }
  const entry = fs.readFile(editor.currentPath)
  return entry?.uri ?? null
})

const taskListOpts = computed(() => {
  return Object.keys(taskData.value)
    .filter(x => !x.startsWith('$'))
    .map(name => ({
      label: name,
      value: name
    }))
})

async function addTask() {
  const name = await requestInput(dialog, 'add task')
  if (!name || name in taskInfo.value) {
    return
  }
  taskData.value[name] = {}
  editor.currentTask = name
}

async function performTaskRename(from: string, to: string | null) {
  if (to) {
    taskData.value[to] = taskData.value[from]
  }
  delete taskData.value[from]
  editor.currentTask = to

  nextTick(() => {
    function rename(next: string): string | null
    function rename(next: string[]): string[]
    function rename(next: string | string[]): string | null | string[]
    function rename(next: string | string[]) {
      if (typeof next === 'string') {
        return next === from ? to : next
      } else {
        return next.map(n => (n === from ? to : n)).filter(x => x)
      }
    }

    fs.find(
      '/pipeline',
      (path, full, entry) => {
        if (full.endsWith('.json') && fs.stat(full, true) === 'text') {
          const data = JSON.parse(entry.content!) as Record<string, Task>
          for (const name in data) {
            const task = data[name]
            for (const key of ['next', 'timeout_next', 'runout_next'] as const) {
              if (task[key]) {
                const res = rename(task[key])
                if (res === null) {
                  delete task[key]
                } else {
                  task[key] = res
                }
              }
            }
            if (task.action === 'Click' && typeof task.target === 'string') {
              const res = rename(task.target)
              if (res === null) {
                delete task.target
              } else {
                task.target = res
              }
            }
            if (task.action === 'Swipe') {
              if (typeof task.begin === 'string') {
                const res = rename(task.begin)
                if (res === null) {
                  delete task.begin
                } else {
                  task.begin = res
                }
              }
              if (typeof task.end === 'string') {
                const res = rename(task.end)
                if (res === null) {
                  delete task.end
                } else {
                  task.end = res
                }
              }
            }
            if (
              typeof task.pre_wait_freezes === 'object' &&
              typeof task.pre_wait_freezes.target === 'string'
            ) {
              const res = rename(task.pre_wait_freezes.target)
              if (res === null) {
                delete task.pre_wait_freezes.target
              } else {
                task.pre_wait_freezes.target = res
              }
            }
            if (
              typeof task.post_wait_freezes === 'object' &&
              typeof task.post_wait_freezes.target === 'string'
            ) {
              const res = rename(task.post_wait_freezes.target)
              if (res === null) {
                delete task.post_wait_freezes.target
              } else {
                task.post_wait_freezes.target = res
              }
            }
          }
          fs.writeText(full, JSON.stringify(data, null, 2))
        }
      },
      () => {}
    )
  })
}
const dialog = useDialog()

async function renameTask() {
  const to = await requestInput(dialog, 'rename task')
  // from in taskData.value === true
  if (!to || to in taskData.value) {
    return
  }

  performTaskRename(editor.currentTask!, to)
}

async function duplicateTask() {
  const to = await requestInput(dialog, 'duplicate task')
  // from in taskData.value === true
  if (!to || to in taskData.value) {
    return
  }

  taskData.value[to] = JSON.parse(JSON.stringify(taskData.value[editor.currentTask!]))
  editor.currentTask = to
}

function deleteTask() {
  performTaskRename(editor.currentTask!, null)
}

async function storeRaiseImage(img: Blob) {
  if (!editor.currentPath || !editor.currentTask) {
    return
  }
  const jsonPath = fs.resolve(editor.currentPath)

  if (jsonPath[0] !== 'pipeline') {
    return
  }
  jsonPath[0] = 'image'

  const jsonName = jsonPath.pop()
  if (!jsonName?.endsWith('.json')) {
    return
  }
  jsonPath.push(jsonName.replace(/\.json$/, ''))
  if (!fs.mkdir(fs.join(...jsonPath))) {
    return
  }
  fs.writeBlob(fs.join(...jsonPath, editor.currentTask + '.png'), img)
}
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <n-split :min="0.1" :max="0.3" :default-size="0.2">
      <template #1>
        <m-explorer></m-explorer>
      </template>
      <template #2>
        <div class="container mx-auto p-4 flex flex-col gap-4 h-full">
          <div class="flex flex-col gap-2 overflow-y-auto" style="max-height: 60%">
            <template v-if="editor.currentPath?.endsWith('.json')">
              <div class="flex items-center gap-2">
                <span> {{ editor.currentPath }} </span>
                <n-button @click="addTask" text>
                  <m-icon> add </m-icon>
                </n-button>
                <n-button @click="renameTask" text :disabled="!editor.currentTask">
                  <m-icon> edit </m-icon>
                </n-button>
                <n-button @click="duplicateTask" text :disabled="!editor.currentTask">
                  <m-icon> content_copy </m-icon>
                </n-button>
                <n-button @click="deleteTask" text :disabled="!editor.currentTask">
                  <m-icon> close </m-icon>
                </n-button>
                <n-select
                  v-model:value="editor.currentTask"
                  :options="taskListOpts"
                  placeholder=""
                ></n-select>
              </div>
              <div class="flex gap-2">
                <n-switch v-model:value="editor.hideUnset"></n-switch>
                <span> hide unset entry </span>
              </div>
              <m-task v-if="task" :task="task"></m-task>
              <n-code v-if="task" :code="JSON.stringify(task, null, 2)" language="json"></n-code>
            </template>
            <template v-else-if="editor.currentPath?.endsWith('.png')">
              <div class="flex items-center gap-2">
                <span> {{ editor.currentPath }} </span>
              </div>
              <div>
                <img v-if="previewImage" :src="previewImage" />
              </div>
            </template>
          </div>
          <div class="flex flex-col flex-1 gap-2">
            <m-crop :accept-raise="!!task" @raise-image="storeRaiseImage"></m-crop>
          </div>
        </div>
      </template>
    </n-split>
  </div>
</template>

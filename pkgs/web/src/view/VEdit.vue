<script setup lang="ts">
import { ImageHandle, awaitUsing } from '@nekosu/maa'
import * as zip from '@zip.js/zip.js'
import { NButton, NCode, NConfigProvider, NSelect, NSplit, NTree } from 'naive-ui'
import type { TreeNodeProps } from 'naive-ui/es/tree/src/interface'
import {
  type WatchStopHandle,
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  shallowRef,
  watch
} from 'vue'

import MCrop from '@/components/MCrop.vue'
import MIcon from '@/components/MIcon.vue'
import MTask from '@/components/MTask.vue'
import { main } from '@/data/main'
import { fs, fsData, imageInfo, taskInfo } from '@/fs'
import type { Task } from '@/types'
import { triggerDownload } from '@/utils/download'

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

async function downloadZip() {
  const blobWriter = new zip.BlobWriter('application/zip')
  const writer = new zip.ZipWriter(blobWriter, { bufferedWrite: true })
  await fs.makeZip(writer)
  await writer.close()
  const data = await blobWriter.getData()
  const dataUrl = URL.createObjectURL(data)

  triggerDownload(dataUrl, 'resource.zip')

  URL.revokeObjectURL(dataUrl)
}

let watchStop: WatchStopHandle | null = null
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
        if (watchStop) {
          watchStop()
          watchStop = null
        }
        taskPath.value = path
        taskData.value = JSON.parse(entry.content)
        currentTask.value = null
        watchStop = watch(
          () => taskData.value,
          v => {
            entry.content = JSON.stringify(v, null, 2)
          },
          {
            deep: true
          }
        )
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

const controller = computed(() => {
  if (!main.active) {
    return null
  }
  return main.data[main.active].shallow.controller ?? null
})

const imageLoading = ref(false)
const cropEl = ref<InstanceType<typeof MCrop> | null>(null)

async function screencap() {
  if (!cropEl.value) {
    console.log('crop loss!')
    return
  }
  imageLoading.value = true
  await awaitUsing(async root => {
    if (!controller.value) {
      return
    }
    const imageHandle = new ImageHandle()
    root.transfer(imageHandle)
    await imageHandle.create()
    const ctrl = controller.value.ref()
    await (await ctrl.postScreencap()).wait()
    await ctrl.image(imageHandle)
    await ctrl.unref()

    const buffer = await imageHandle.encoded(true)
    const url = URL.createObjectURL(new Blob([buffer.buffer]))
    if (!cropEl.value?.setImage(url)) {
      URL.revokeObjectURL(url)
    }
  })
  imageLoading.value = false
}
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <input ref="selectZipEl" type="file" accept=".zip" class="hidden" />

    <n-split :min="0.1" :max="0.3" :default-size="0.2">
      <template #1>
        <div class="flex flex-col gap-2">
          <div class="flex gap-2 p-2">
            <n-button @click="uploadZip"> 导入 </n-button>
            <n-button @click="downloadZip"> 导出 </n-button>
          </div>
          <n-tree :data="fsData" expand-on-click :node-props="nodeProps"></n-tree>
        </div>
      </template>
      <template #2>
        <div class="container mx-auto p-4 flex flex-col gap-4 h-full">
          <div class="flex items-center gap-2">
            <span> {{ taskPath }} </span>
            <template v-if="taskPath">
              <n-button @click="addTask" text>
                <m-icon> add </m-icon>
              </n-button>
              <n-button @click="renameTask" text :disabled="!currentTask">
                <m-icon> edit </m-icon>
              </n-button>
              <n-select
                v-model:value="currentTask"
                :options="taskListOpts"
                placeholder=""
              ></n-select>
            </template>
          </div>
          <m-task v-if="task" :task="task"></m-task>
          <n-code :code="JSON.stringify(task, null, 2)" language="json"></n-code>
          <div v-if="controller" class="flex flex-col flex-1">
            <div class="flex gap-2">
              <n-button @click="screencap" :disabled="!controller" :loading="imageLoading">
                screencap
              </n-button>
            </div>
            <m-crop ref="cropEl" class="flex-1"></m-crop>
          </div>
        </div>
      </template>
    </n-split>
  </div>
</template>

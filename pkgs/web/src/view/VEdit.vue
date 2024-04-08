<script setup lang="ts">
import { BaklavaEditor, useBaklava } from '@baklavajs/renderer-vue'
import '@baklavajs/themes/dist/syrup-dark.css'
import * as zip from '@zip.js/zip.js'
import { NButton, NConfigProvider, darkTheme } from 'naive-ui'
import { onMounted, ref, shallowRef } from 'vue'

import MIcon from '@/components/MIcon.vue'
import { TaskNode } from '@/edit/node'

const baklava = useBaklava()

baklava.editor.registerNodeType(TaskNode)

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
    const zipInst = new zip.ZipReader(reader)
    for (const entry of await zipInst.getEntries()) {
      console.log(entry.filename)
    }
  })
}

function exportGraph() {
  console.log(baklava.editor.save())
  console.log(baklava.editor.graph)
}
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <input ref="selectZipEl" type="file" accept=".zip" class="hidden" />
    <div class="flex gap-2 p-2">
      <n-button @click="uploadZip"> 上传 </n-button>
      <n-button @click="exportGraph"> 导出 </n-button>
    </div>
    <div class="flex-1">
      <n-config-provider :theme="darkTheme" class="w-full h-full">
        <BaklavaEditor :view-model="baklava"></BaklavaEditor>
      </n-config-provider>
    </div>
  </div>
</template>

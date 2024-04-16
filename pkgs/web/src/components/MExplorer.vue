<script setup lang="ts">
import * as zip from '@zip.js/zip.js'
import { type DropdownOption, NButton, NDropdown, NTree, useDialog } from 'naive-ui'
import type { TreeNodeProps } from 'naive-ui/es/tree/src/interface'
import { ref } from 'vue'

import { editor } from '@/data/editor'
import { fs, fsData } from '@/fs'
import { triggerDownload, triggerUpload } from '@/utils/download'
import { requestInput } from '@/utils/input'

async function uploadZip() {
  const file = await triggerUpload({
    mimeTypes: ['application/zip']
  })
  if (file) {
    const reader = new zip.BlobReader(file)
    editor.reset()
    fs.reset()
    await fs.loadZip(new zip.ZipReader(reader))
  }
}

async function downloadZip() {
  const blobWriter = new zip.BlobWriter('application/zip')
  const writer = new zip.ZipWriter(blobWriter, { bufferedWrite: true })
  await fs.makeZip(writer)
  await writer.close()
  const data = await blobWriter.getData()
  triggerDownload(data, 'resource.zip')
}

const menuShow = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuItems = ref<DropdownOption[]>([])
const menuTarget = ref('')

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
        editor.switchFile(path)
        return
      } else if (path.endsWith('.png') && path.startsWith('/image/')) {
        const entry = fs.readFile(path)
        if (!entry || entry.uri === undefined) {
          return
        }
        editor.switchFile(path)
        return
      }
    },
    onContextmenu(payload) {
      const path = option.key
      if (!path || typeof path !== 'string') {
        return
      }
      switch (fs.stat(path)) {
        case 'directory':
          menuItems.value = [
            {
              label: 'add directory',
              key: 'add.dir'
            },
            {
              label: 'add json',
              key: 'add.json'
            },
            {
              label: 'rename',
              key: 'rename'
            },
            {
              label: 'delete',
              key: 'del'
            }
          ]
          break
        case 'file':
          menuItems.value = [
            {
              label: 'rename',
              key: 'rename'
            },
            {
              label: 'delete',
              key: 'del'
            }
          ]
          break
        default:
          return
      }

      menuX.value = payload.clientX
      menuY.value = payload.clientY
      menuShow.value = true
      menuTarget.value = path
      payload.preventDefault()
    }
  }
}

const dialog = useDialog()

async function performSelect(key: string | number, option: DropdownOption) {
  if (typeof key !== 'string' || !menuTarget.value) {
    return
  }
  const type = fs.stat(menuTarget.value)
  if (!type) {
    return
  }
  menuShow.value = false
  switch (key) {
    case 'add.dir': {
      const name = await requestInput(dialog, 'add directory')
      if (!name) {
        return
      }
      const path = fs.join(menuTarget.value, name)
      if (fs.stat(path)) {
        return
      }
      fs.mkdir(path)
      break
    }
    case 'add.json': {
      let name = await requestInput(dialog, 'add json')
      if (!name) {
        return
      }
      const path = fs.join(menuTarget.value, name)
      if (fs.stat(path)) {
        return
      }
      fs.writeText(path, '{}')
      break
    }
    case 'rename': {
      let name = await requestInput(dialog, 'rename')
      if (!name) {
        return
      }
      const dir = fs.dirname(menuTarget.value)
      const path = fs.join(...dir, name)
      if (fs.stat(path)) {
        return
      }
      fs.rename(menuTarget.value, path)
      break
    }
    case 'del': {
      fs.rm(menuTarget.value)
      break
    }
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2 p-2">
      <n-button @click="uploadZip"> 导入 </n-button>
      <n-button @click="downloadZip"> 导出 </n-button>
    </div>
    <n-tree :data="fsData" expand-on-click :node-props="nodeProps"></n-tree>
    <n-dropdown
      trigger="manual"
      placement="bottom-start"
      :show="menuShow"
      :options="menuItems"
      :x="menuX"
      :y="menuY"
      @select="performSelect"
      @clickoutside="menuShow = false"
    ></n-dropdown>
  </div>
</template>

<script setup lang="ts">
import { type DropdownOption, NButton, NDropdown, NSelect, NTree, useDialog } from 'naive-ui'
import type { TreeDropInfo, TreeNodeProps } from 'naive-ui/es/tree/src/interface'
import { nextTick, ref } from 'vue'

import { editor } from '@/data/editor'
import { fs, fsData } from '@/fs'
import { db } from '@/utils/db'
import { triggerDownload, triggerUpload } from '@/utils/download'
import { requestInput, requestInputPath } from '@/utils/input'
import { waitNext } from '@/utils/misc'

async function uploadZip() {
  const file = await triggerUpload({
    mimeTypes: ['application/zip']
  })
  if (file) {
    editor.currentPath = null
    editor.currentTask = null
    await waitNext()
    await fs.loadZipData(file)
  }
}

async function downloadZip() {
  triggerDownload(await fs.makeZipData(), 'resource.zip')
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
            },
            {
              label: 'download',
              key: 'download'
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
            },
            {
              label: 'download',
              key: 'download'
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
      let name = await requestInputPath(dialog, 'add json', '', '.json')
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
      let name = await requestInputPath(dialog, 'rename', '', fs.basename(menuTarget.value)!)
      if (!name) {
        return
      }
      const normCur = editor.currentPath ? fs.normalize(editor.currentPath) : null
      const normTgt = fs.normalize(menuTarget.value)
      let editorAffected = normCur?.startsWith(normTgt + '/') || normCur === normTgt
      let currentTask = editor.currentTask
      if (editorAffected) {
        editor.currentPath = null
        editor.currentTask = null
      }
      await waitNext()
      const dir = fs.dirname(menuTarget.value)
      const path = fs.join(...dir, name)
      if (fs.stat(path)) {
        return
      }
      fs.rename(menuTarget.value, path)
      if (name.endsWith('.png')) {
        fs.rename(menuTarget.value + '.roi', path + '.roi')
      }
      if (editorAffected) {
        editor.currentPath = normCur === normTgt ? path : normCur!.replace(normTgt, path + '/')
        editor.currentTask = currentTask
      }
      break
    }
    case 'del': {
      const normCur = editor.currentPath ? fs.normalize(editor.currentPath) : null
      const normTgt = fs.normalize(menuTarget.value)
      let editorAffected = normCur?.startsWith(normTgt + '/') || normCur === normTgt
      if (editorAffected) {
        editor.currentTask = null
        editor.currentPath = null
      }
      fs.rm(menuTarget.value)
      break
    }
    case 'download': {
      switch (fs.stat(menuTarget.value)) {
        case 'directory':
          triggerDownload(
            await fs.compressZipData(menuTarget.value),
            (fs.basename(menuTarget.value) ?? 'directory') + '.zip'
          )
          break
        case 'file': {
          const file = fs.readFile(menuTarget.value)
          if (file?.uri) {
            triggerDownload(
              await (await fetch(file.uri)).blob(),
              fs.basename(menuTarget.value) ?? 'file'
            )
          } else if (file?.content) {
            triggerDownload(
              new Blob([file.content], { type: 'text/plain' }),
              fs.basename(menuTarget.value) ?? 'file'
            )
          }
          break
        }
      }
    }
  }
}

function handleDrop({ node, dragNode, dropPosition }: TreeDropInfo) {
  if (typeof dragNode.key !== 'string' || typeof node.key !== 'string') {
    return
  }
  const fromStat = fs.stat(dragNode.key)
  const toStat = fs.stat(node.key)
  if (!fromStat || !toStat) {
    return
  }
  let action = dropPosition === 'inside' ? 'inside' : 'beside'
  if (toStat === 'file') {
    action = 'beside'
  }
  const fromName = fs.basename(dragNode.key)
  if (!fromName) {
    return
  }
  const toDir = action === 'inside' ? fs.resolve(node.key) : fs.dirname(node.key)
  fs.rename(dragNode.key, fs.join(...toDir, fromName))
}

async function handleDropFile(event: DragEvent) {
  const putFile = async (file: File) => {
    if (file.name.endsWith('.zip')) {
      const dir = await requestInput(
        dialog,
        'drop zip',
        'extract to directory (cancel to directly put)'
      )
      if (dir) {
        await fs.extractZipData(file, dir)
        return
      }
    }
    await fs.writeFile(file.name, file)
  }
  if (event.dataTransfer?.items) {
    for (const item of event.dataTransfer.items) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file) {
          if (item.webkitGetAsEntry()?.isDirectory) {
            continue
          }
          await putFile(file)
        }
      }
    }
  } else if (event.dataTransfer?.files) {
    for (const file of event.dataTransfer.files) {
      await putFile(file)
    }
  }
}

const switchingFs = ref(false)

async function createFs() {
  const name = await requestInput(dialog, 'fs name')
  if (name) {
    switchFs(name)
  }
}

async function removeFs() {
  editor.currentPath = null
  editor.currentTask = null
  await waitNext()
  const cur = fs.name
  const rest = db.fsEntry.value.filter(x => x !== cur)
  if (!rest) {
    return
  }
  await switchFs(rest[0])
  await db.delFs(cur)
}

async function switchFs(name: string) {
  editor.currentPath = null
  editor.currentTask = null
  await waitNext()
  switchingFs.value = true
  await fs.switchFs(name)
  switchingFs.value = false
}
</script>

<template>
  <div class="flex flex-col gap-2 p-2 h-full">
    <div class="flex gap-2">
      <n-button size="small" @click="uploadZip"> 上传 </n-button>
      <n-button size="small" @click="downloadZip"> 下载 </n-button>
      <n-button size="small" @click="createFs"> 新建 </n-button>
      <n-button size="small" @click="removeFs" :disabled="db.fsEntry.value.length <= 1">
        删除
      </n-button>
    </div>
    <n-select
      :value="fs.name"
      @update:value="switchFs"
      :loading="switchingFs"
      :options="db.fsEntry.value.map(x => ({ label: x, value: x }))"
    ></n-select>
    <n-tree
      draggable
      :data="fsData"
      expand-on-click
      :node-props="nodeProps"
      @drop="handleDrop"
    ></n-tree>
    <div
      class="flex items-center justify-center flex-1 min-h-8 bg-gray-100"
      @drop.prevent="handleDropFile"
      @dragover.prevent=""
    >
      drop file
    </div>
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

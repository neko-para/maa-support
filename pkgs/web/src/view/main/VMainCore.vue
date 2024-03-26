<script setup lang="ts">
import {
  type AdbTypeKey,
  type AdbTypeObj,
  type AdbTypeScreencap,
  type AdbTypeTouch,
  fromAdbType,
  toAdbType
} from '@maa/maa'
import { NButton, NCard, NDivider, NInput, NSelect, NTabPane, NTabs } from 'naive-ui'
import { computed, reactive, ref } from 'vue'

import { main } from '@/data/main'

const props = defineProps<{
  id: string
}>()

const touchOpts = ['adb', 'mini touch', 'maa touch', 'auto detect'].map(x => ({
  label: x,
  value: x
}))

const keyOpts = ['adb', 'maa touch', 'auto detect'].map(x => ({
  label: x,
  value: x
}))

const screencapOpts = [
  'raw by netcat',
  'raw with gzip',
  'encode',
  'encode to file',
  'minicap direct',
  'minicap stream',
  'fastest lossless way',
  'fastest way'
].map(x => ({
  label: x,
  value: x
}))
const adb_type_touch = computed<AdbTypeTouch | undefined>({
  set(type) {
    main.data[props.id].config.cfg.type = toAdbType(
      type,
      adb_type_key.value,
      adb_type_screencap.value
    )
  },
  get() {
    return fromAdbType(main.data[props.id].config.cfg.type ?? 0).touch
  }
})

const adb_type_key = computed<AdbTypeKey | undefined>({
  set(type) {
    main.data[props.id].config.cfg.type = toAdbType(
      adb_type_touch.value,
      type,
      adb_type_screencap.value
    )
  },
  get() {
    return fromAdbType(main.data[props.id].config.cfg.type ?? 0).key
  }
})

const adb_type_screencap = computed<AdbTypeScreencap | undefined>({
  set(type) {
    main.data[props.id].config.cfg.type = toAdbType(adb_type_touch.value, adb_type_key.value, type)
  },
  get() {
    return fromAdbType(main.data[props.id].config.cfg.type ?? 0).screencap
  }
})

function performScan() {}
</script>

<template>
  <div class="flex-1 flex flex-col items-center">
    <div class="container flex flex-col p-4 gap-4">
      <div class="flex">
        <n-input
          v-model:value="main.data[id].name"
          class="min-w-32"
          placeholder=""
          autosize
        ></n-input>
      </div>
      <n-card title="controller">
        <n-tabs v-model:value="main.data[id].config.type" animated>
          <n-tab-pane name="adb" tab="Android">
            <div class="flex flex-col">
              <div class="grid items-center gap-2" style="grid-template-columns: max-content auto">
                <span> Adb </span>
                <n-input v-model:value="main.data[id].config.cfg.adb_path" placeholder=""></n-input>
                <span> Address </span>
                <n-input v-model:value="main.data[id].config.cfg.address" placeholder=""></n-input>
                <span> Type </span>
                <div class="flex gap-2">
                  <n-select
                    v-model:value="adb_type_touch"
                    :options="touchOpts"
                    placeholder=""
                  ></n-select>
                  <n-select
                    v-model:value="adb_type_key"
                    :options="keyOpts"
                    placeholder=""
                  ></n-select>
                  <n-select
                    v-model:value="adb_type_screencap"
                    :options="screencapOpts"
                    placeholder=""
                  ></n-select>
                </div>
                <span> Config </span>
                <n-input v-model:value="main.data[id].config.cfg.config" placeholder=""></n-input>
              </div>
              <n-divider></n-divider>
              <div class="flex">
                <n-button @click="performScan"> scan </n-button>
              </div>
            </div>
          </n-tab-pane>
          <n-tab-pane name="win32" tab="Windows">
            <div class="grid items-center gap-2" style="grid-template-columns: max-content auto">
              <span> Hwnd </span>
              <n-input v-model:value="main.data[id].config.cfg.hwnd" placeholder=""></n-input>
            </div>
          </n-tab-pane>
        </n-tabs>
      </n-card>
    </div>
  </div>
</template>

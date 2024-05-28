<script setup lang="ts">
import {
  type AdbConfig,
  AdbController,
  Controller,
  ControllerOption,
  type DeviceInfo,
  type HwndId,
  Status,
  TrivialCallback,
  Win32Controller,
  awaitUsing,
  findDevice
} from '@nekosu/maa'
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDivider,
  NInput,
  NInputNumber,
  NSwitch,
  NTabPane,
  NTabs
} from 'naive-ui'
import { computed, ref } from 'vue'

import MAdbConfig from '@/components/MAdbConfig.vue'
import MIcon from '@/components/MIcon.vue'
import MWin32Config from '@/components/MWin32Config.vue'
import MWin32Find from '@/components/MWin32Find.vue'
import { main } from '@/data/main'
import { setting } from '@/data/setting'

const props = defineProps<{
  id: string
  instanceLoading?: boolean
}>()

const emits = defineEmits<{
  log: [string, string]
}>()

const data = computed(() => {
  return main.data[props.id]
})

const win32FindEl = ref<InstanceType<typeof MWin32Find> | null>(null)

const scanning = ref(false)
const adbScanResult = ref<DeviceInfo[] | null>(null)
const win32ScanResult = ref<HwndId[] | null>(null)

async function performScanAdb() {
  scanning.value = true
  adbScanResult.value = await findDevice()
  scanning.value = false
}

async function performScanWin32() {
  scanning.value = true
  win32ScanResult.value = (await win32FindEl.value?.performScan()) ?? null
  scanning.value = false
}

async function prepareCallback() {
  return awaitUsing(async root => {
    const cb = root.transfer(new TrivialCallback())
    if (
      await cb.prepareCallback(async (msg, detail) => {
        emits('log', msg, detail)
      })
    ) {
      return cb.ref()
    }
    return null
  })
}

const controllerLoading = ref(false)

function checkAdbConfig(cfg?: Partial<AdbConfig>): cfg is AdbConfig {
  return !!(cfg && cfg.address && cfg.adb_path && cfg.type && cfg.config)
}

async function createControllerImpl() {
  return awaitUsing(async root => {
    const cb = root.transfer(await prepareCallback())
    if (!cb) {
      console.log('check callback failed')
      return false
    }
    let outCtrl: Controller
    if (!data.value.config.controller.ctype || data.value.config.controller.ctype === 'adb') {
      if (!checkAdbConfig(data.value.config.controller.adb_cfg) || !setting.agentPath) {
        console.log('check config or agentPath failed')
        return false
      }
      const adbCtrl = root.transfer(new AdbController())
      if (!(await adbCtrl.create(data.value.config.controller.adb_cfg, setting.agentPath!, cb))) {
        console.log('create failed')
        return false
      }
      outCtrl = adbCtrl.ref()
    } else if (data.value.config.controller.ctype === 'win32') {
      if (
        !data.value.config.controller.win_cfg?.type ||
        !data.value.config.controller.win_cfg?.hwnd
      ) {
        console.log('check type or hwnd failed')
        return false
      }
      const winCtrl = root.transfer(new Win32Controller())
      if (
        !(await winCtrl.create(
          data.value.config.controller.win_cfg?.hwnd,
          data.value.config.controller.win_cfg?.type,
          cb
        ))
      ) {
        console.log('create failed')
        return false
      }
      outCtrl = winCtrl.ref()
    } else {
      return false
    }
    const ctrl = root.transfer(outCtrl)
    if (
      data.value.config.controller.startEntry &&
      !(await ctrl.setDefaultStartApp(data.value.config.controller.startEntry))
    ) {
      console.log('set option failed')
      return false
    }
    if (
      data.value.config.controller.stopEntry &&
      !(await ctrl.setDefaultStopApp(data.value.config.controller.stopEntry))
    ) {
      console.log('set option failed')
      return false
    }
    if (
      !data.value.config.controller.useLongSide &&
      !(await ctrl.setShortSide(data.value.config.controller.shortSide ?? 720))
    ) {
      console.log('set option failed')
      return false
    }
    if (
      data.value.config.controller.useLongSide &&
      !(await ctrl.setLongSide(data.value.config.controller.longSide ?? 1080))
    ) {
      console.log('set option failed')
      return false
    }
    if ((await (await ctrl.postConnection()).wait()) !== Status.Success) {
      console.log('connect failed')
      return false
    }
    data.value.shallow.controller = ctrl.ref()
    return true
  })
}

async function createController() {
  controllerLoading.value = true
  const ret = await createControllerImpl()
  controllerLoading.value = false
  return ret
}

async function disposeControllerImpl() {
  await data.value.shallow.controller?.unref()
  delete data.value.shallow.controller
}

async function disposeController() {
  controllerLoading.value = true
  const ret = await disposeControllerImpl()
  controllerLoading.value = false
  return ret
}

defineExpose({
  createController
})
</script>

<template>
  <n-card title="controller">
    <template #header>
      <div class="flex items-center gap-2">
        <n-button
          v-if="!data.shallow.controller"
          @click="createController"
          :loading="controllerLoading"
        >
          connect
        </n-button>
        <n-button
          v-else
          @click="disposeController"
          :loading="controllerLoading"
          :disabled="instanceLoading || !!data.shallow.instance"
        >
          disconnect
        </n-button>
        <span> controller </span>
      </div>
    </template>
    <div class="maa-form mb-4">
      <span> start entry </span>
      <n-input
        :value="data.config.controller.startEntry ?? null"
        @update:value="v => (data.config.controller.startEntry = v)"
        :disabled="controllerLoading || !!data.shallow.controller"
        placeholder=""
      >
        <template #suffix>
          <n-button
            v-if="data.config.controller.startEntry"
            @click="data.config.controller.startEntry = undefined"
            :disabled="controllerLoading || !!data.shallow.controller"
            text
          >
            <m-icon> close </m-icon>
          </n-button>
        </template>
      </n-input>
      <span> stop entry </span>
      <n-input
        :value="data.config.controller.stopEntry ?? null"
        @update:value="v => (data.config.controller.stopEntry = v)"
        :disabled="controllerLoading || !!data.shallow.controller"
        placeholder=""
      >
        <template #suffix>
          <n-button
            v-if="data.config.controller.stopEntry"
            @click="data.config.controller.stopEntry = undefined"
            :disabled="controllerLoading || !!data.shallow.controller"
            text
          >
            <m-icon> close </m-icon>
          </n-button>
        </template>
      </n-input>
      <span> use long side </span>
      <div class="flex items-center">
        <n-switch v-model:value="data.config.controller.useLongSide"></n-switch>
      </div>
      <span> short side </span>
      <n-input-number
        v-model:value="data.config.controller.shortSide"
        :show-button="false"
        :disabled="controllerLoading || !!data.shallow.controller"
        placeholder="720"
      ></n-input-number>
      <span> long side </span>
      <n-input-number
        v-model:value="data.config.controller.longSide"
        :show-button="false"
        :disabled="controllerLoading || !!data.shallow.controller"
        placeholder="1080"
      ></n-input-number>
    </div>
    <n-tabs
      :value="data.config.controller.ctype ?? 'adb'"
      @update:value="v => (data.config.controller.ctype = v)"
      animated
    >
      <n-tab-pane name="adb" tab="Android">
        <div class="flex flex-col">
          <m-adb-config
            v-model:value="data.config.controller.adb_cfg"
            :disabled="controllerLoading || !!data.shallow.controller"
          ></m-adb-config>
          <n-divider></n-divider>

          <div class="flex flex-col gap-2">
            <div class="flex">
              <n-button @click="performScanAdb" :loading="scanning"> scan </n-button>
            </div>
            <n-collapse>
              <n-collapse-item v-for="(res, idx) of adbScanResult ?? []" :key="idx">
                <template #header>
                  <div class="flex items-center gap-2">
                    <n-button
                      @click.stop="
                        () => {
                          data.config.controller.adb_cfg = data.config.controller.adb_cfg ?? {}
                          Object.assign(data.config.controller.adb_cfg, res)
                        }
                      "
                      :disabled="controllerLoading || !!data.shallow.controller"
                    >
                      copy
                    </n-button>
                    <span>
                      {{ res.name }}
                    </span>
                  </div>
                </template>
                <m-adb-config :value="res" disabled></m-adb-config>
              </n-collapse-item>
            </n-collapse>
          </div>
        </div>
      </n-tab-pane>
      <n-tab-pane name="win32" tab="Windows">
        <div class="flex flex-col">
          <m-win32-config
            v-model:value="data.config.controller.win_cfg"
            :disabled="controllerLoading || !!data.shallow.controller"
          ></m-win32-config>

          <n-divider></n-divider>

          <div class="flex flex-col gap-2">
            <m-win32-find
              ref="win32FindEl"
              v-model:class-name="data.config.controllerCache.className"
              v-model:window-name="data.config.controllerCache.windowName"
              v-model:exact-match="data.config.controllerCache.exactMatch"
            ></m-win32-find>
            <div class="flex">
              <n-button @click="performScanWin32" :loading="scanning"> scan </n-button>
            </div>
            <n-collapse>
              <n-collapse-item v-for="(res, idx) of win32ScanResult ?? []" :key="idx">
                <template #header>
                  <div class="flex items-center gap-2">
                    <n-button
                      @click.stop="
                        () => {
                          data.config.controller.win_cfg = data.config.controller.win_cfg ?? {}
                          data.config.controller.win_cfg.hwnd = res
                        }
                      "
                      :disabled="controllerLoading || !!data.shallow.controller"
                    >
                      copy
                    </n-button>
                    <span>
                      {{ res }}
                    </span>
                  </div>
                </template>
                <!-- <m-adb-config :value="res" disabled></m-adb-config> -->
              </n-collapse-item>
            </n-collapse>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>

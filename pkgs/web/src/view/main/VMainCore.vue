<script setup lang="ts">
import {
  type AdbConfig,
  AdbController,
  Controller,
  ControllerOption,
  type DeviceInfo,
  type HwndId,
  Instance,
  Resource,
  Status,
  TrivialCallback,
  Win32Controller,
  findDevice
} from '@maa/maa'
import {
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDivider,
  NInput,
  NSplit,
  NTabPane,
  NTabs
} from 'naive-ui'
import { computed, reactive, ref } from 'vue'

import MAdbConfig from '@/components/MAdbConfig.vue'
import MIcon from '@/components/MIcon.vue'
import MWin32Config from '@/components/MWin32Config.vue'
import MWin32Find from '@/components/MWin32Find.vue'
import { main } from '@/data/main'
import { setting } from '@/data/setting'

const props = defineProps<{
  id: string
}>()

const data = computed(() => {
  return main.data[props.id]
})

const win32FindEl = ref<InstanceType<typeof MWin32Find> | null>(null)

const longSide = ref<number | null>(null)
const shortSide = ref<number | null>(null)

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

const log = ref<[msg: string, detail: string][]>([])

async function prepareCallback() {
  await using cb = new TrivialCallback()
  if (
    await cb.prepareCallback(async (msg, detail) => {
      log.value.push([msg, detail])
    })
  ) {
    return cb.ref()
  }
  return null
}

const controllerLoading = ref(false)

function checkAdbConfig(cfg: Partial<AdbConfig>): cfg is AdbConfig {
  return !!(cfg.address && cfg.adb_path && cfg.type && cfg.config)
}

async function createControllerImpl() {
  await using cb = await prepareCallback()
  if (!cb) {
    console.log('check callback failed')
    return false
  }
  let outCtrl: Controller
  if (data.value.config.type === 'adb') {
    if (!checkAdbConfig(data.value.config.cfg) || !setting.agentPath) {
      console.log('check config or agentPath failed')
      return false
    }
    await using adbCtrl = new AdbController()
    if (!(await adbCtrl.create(data.value.config.cfg, setting.agentPath!, cb))) {
      console.log('create failed')
      return false
    }
    outCtrl = adbCtrl.ref()
  } else if (data.value.config.type === 'win32') {
    if (!data.value.config.cfg.winType || !data.value.config.cfg.hWnd) {
      console.log('check winType or hWnd failed')
      return false
    }
    await using winCtrl = new Win32Controller()
    if (!(await winCtrl.create(data.value.config.cfg.hWnd, data.value.config.cfg.winType, cb))) {
      console.log('create failed')
      return false
    }
    outCtrl = winCtrl.ref()
  } else {
    return false
  }
  await using ctrl = outCtrl
  if (
    data.value.config.startEntry &&
    !(await ctrl.setOption(ControllerOption.DefaultAppPackageEntry, data.value.config.startEntry))
  ) {
    console.log('set option failed')
    return false
  }
  if (
    data.value.config.stopEntry &&
    !(await ctrl.setOption(ControllerOption.DefaultAppPackage, data.value.config.stopEntry))
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
}

async function createController() {
  controllerLoading.value = true
  const ret = await createControllerImpl()
  controllerLoading.value = false
  return ret
}

async function disposeControllerImpl() {
  await data.value.shallow.controller?.dispose()
  delete data.value.shallow.controller
}

async function disposeController() {
  controllerLoading.value = true
  const ret = await disposeControllerImpl()
  controllerLoading.value = false
  return ret
}

const resourceLoading = ref(false)

async function createResourceImpl() {
  await using cb = await prepareCallback()
  if (!cb) {
    console.log('check callback failed')
    return false
  }
  if (!data.value.config.path) {
    console.log('check path failed')
    return false
  }
  await using res = new Resource()
  if (!(await res.create(cb))) {
    console.log('create failed')
    return false
  }
  if ((await (await res.postPath(data.value.config.path!)).wait()) === Status.Success) {
    data.value.shallow.resource = res.ref()
    return true
  } else {
    await res.dispose()
    return false
  }
}

async function createResource() {
  resourceLoading.value = true
  const ret = await createResourceImpl()
  resourceLoading.value = false
  return ret
}

async function disposeResourceImpl() {
  await data.value.shallow.resource?.dispose()
  delete data.value.shallow.resource
}

async function disposeResource() {
  resourceLoading.value = true
  const ret = await disposeResourceImpl()
  resourceLoading.value = false
  return ret
}

const instanceLoading = ref(false)

async function createInstanceImpl() {
  await using cb = await prepareCallback()
  if (!cb) {
    console.log('check callback failed')
    return false
  }
  await using inst = new Instance()
  if (!(await inst.create(cb))) {
    console.log('create failed')
    return false
  }
  if (!data.value.shallow.controller && !(await createController())) {
    console.log('failed for controller')
    return false
  }
  if (!data.value.shallow.resource && !(await createResource())) {
    console.log('failed for resource')
    return false
  }
  if (
    !(await inst.bindCtrl(data.value.shallow.controller!)) ||
    !(await inst.bindRes(data.value.shallow.resource!))
  ) {
    console.log('failed for bind')
    return false
  }
  if (await inst.inited()) {
    data.value.shallow.instance = inst.ref()
    return true
  } else {
    return false
  }
}

async function createInstance() {
  instanceLoading.value = true
  const ret = await createInstanceImpl()
  instanceLoading.value = false
  return ret
}

async function disposeInstanceImpl() {
  await data.value.shallow.instance?.dispose()
  delete data.value.shallow.instance
}

async function disposeInstance() {
  instanceLoading.value = true
  const ret = await disposeInstanceImpl()
  instanceLoading.value = false
  return ret
}

const running = ref(false)

async function startRunImpl() {
  if (!data.value.config.task) {
    console.log('failed for no task')
    return false
  }
  return (
    (await (
      await data.value.shallow.instance?.postTask(
        data.value.config.task,
        data.value.config.param ?? '{}'
      )
    )?.wait()) === Status.Success
  )
}

async function startRun() {
  running.value = true
  const ret = await startRunImpl()
  running.value = false
  return ret
}

async function postStop() {
  await data.value.shallow.instance?.postStop()
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center h-full container">
    <n-split :default-size="0.8" :min="0.5" :max="0.95" class="h-full">
      <template #1>
        <div class="w-full h-full overflow-y-auto">
          <div class="flex flex-col p-4 gap-4">
            <div class="flex">
              <n-input v-model:value="data.name" class="min-w-32" placeholder="" autosize></n-input>
            </div>
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
                  :value="data.config.startEntry ?? null"
                  @update:value="v => (data.config.startEntry = v)"
                  :disabled="controllerLoading || !!data.shallow.controller"
                  placeholder=""
                >
                  <template #suffix>
                    <n-button
                      v-if="data.config.startEntry"
                      @click="data.config.startEntry = undefined"
                      :disabled="controllerLoading || !!data.shallow.controller"
                      text
                    >
                      <m-icon> close </m-icon>
                    </n-button>
                  </template>
                </n-input>
                <span> stop entry </span>
                <n-input
                  :value="data.config.stopEntry ?? null"
                  @update:value="v => (data.config.stopEntry = v)"
                  :disabled="controllerLoading || !!data.shallow.controller"
                  placeholder=""
                >
                  <template #suffix>
                    <n-button
                      v-if="data.config.stopEntry"
                      @click="data.config.stopEntry = undefined"
                      :disabled="controllerLoading || !!data.shallow.controller"
                      text
                    >
                      <m-icon> close </m-icon>
                    </n-button>
                  </template>
                </n-input>
              </div>
              <n-tabs v-model:value="data.config.type" animated>
                <n-tab-pane name="adb" tab="Android">
                  <div class="flex flex-col">
                    <m-adb-config
                      v-model:value="data.config.cfg"
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
                                @click.stop="Object.assign(data.config.cfg, res)"
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
                    <div class="maa-form">
                      <span> hwnd </span>
                      <n-input v-model:value="data.config.cfg.hWnd" placeholder=""></n-input>
                      <m-win32-config
                        v-model:value="data.config.cfg.winType"
                        :disabled="controllerLoading || !!data.shallow.controller"
                      ></m-win32-config>
                    </div>
                    <n-divider></n-divider>

                    <div class="flex flex-col gap-2">
                      <m-win32-find
                        ref="win32FindEl"
                        v-model:class-name="data.config.cfg.className"
                        v-model:window-name="data.config.cfg.windowName"
                        v-model:exact-match="data.config.cfg.exactMatch"
                      ></m-win32-find>
                      <div class="flex">
                        <n-button @click="performScanWin32" :loading="scanning"> scan </n-button>
                      </div>
                      <n-collapse>
                        <n-collapse-item v-for="(res, idx) of win32ScanResult ?? []" :key="idx">
                          <template #header>
                            <div class="flex items-center gap-2">
                              <n-button
                                @click.stop="data.config.cfg.hWnd = res"
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
            <n-card>
              <template #header>
                <div class="flex items-center gap-2">
                  <n-button
                    v-if="!data.shallow.resource"
                    @click="createResource"
                    :loading="resourceLoading"
                  >
                    connect
                  </n-button>
                  <n-button
                    v-else
                    @click="disposeResource"
                    :loading="resourceLoading"
                    :disabled="instanceLoading || !!data.shallow.instance"
                  >
                    disconnect
                  </n-button>
                  <span> resource </span>
                </div>
              </template>
              <div class="maa-form">
                <span> path </span>
                <n-input
                  v-model:value="data.config.path"
                  placeholder=""
                  :disabled="resourceLoading || !!data.shallow.resource"
                ></n-input>
              </div>
            </n-card>
            <n-card>
              <template #header>
                <div class="flex items-center gap-2">
                  <n-button
                    v-if="!data.shallow.instance"
                    @click="createInstance"
                    :loading="instanceLoading"
                  >
                    connect
                  </n-button>
                  <n-button
                    v-else
                    @click="disposeInstance"
                    :loading="instanceLoading"
                    :disabled="running"
                  >
                    disconnect
                  </n-button>
                  <span> instance </span>
                </div>
              </template>
              <div class="maa-form">
                <span> task </span>
                <n-input v-model:value="data.config.task" placeholder=""></n-input>
                <span> param </span>
                <n-input v-model:value="data.config.param" placeholder=""></n-input>
              </div>
              <n-divider></n-divider>
              <div class="flex gap-2">
                <n-button
                  @click="startRun"
                  :loading="running"
                  :disabled="instanceLoading || !data.shallow.instance"
                >
                  run
                </n-button>
                <n-button @click="postStop" :disabled="!running || !data.shallow.instance">
                  stop
                </n-button>
              </div>
            </n-card>
          </div>
        </div>
      </template>
      <template #2>
        <div class="w-full h-full overflow-auto">
          <div class="maa-form">
            <template v-for="(msg, idx) in log" :key="idx">
              <span> {{ msg[0] }} </span>
              <span> {{ msg[1] }} </span>
            </template>
          </div>
        </div>
      </template>
    </n-split>
  </div>
</template>

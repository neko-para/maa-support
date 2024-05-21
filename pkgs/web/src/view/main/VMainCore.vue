<script setup lang="ts">
import {
  type AdbConfig,
  AdbController,
  Controller,
  ControllerOption,
  type DeviceInfo,
  type HwndId,
  ImageListHandle,
  Instance,
  Message,
  Resource,
  Status,
  TrivialCallback,
  Win32Controller,
  awaitUsing,
  findDevice,
  queryRecoDetail
} from '@nekosu/maa'
import { NButton, NCard, NDivider, NInput, NSplit } from 'naive-ui'
import { computed, reactive, ref } from 'vue'

import MController from '@/components/maa/MController.vue'
import MInstance from '@/components/maa/MInstance.vue'
import MResource from '@/components/maa/MResource.vue'
import { TaskList } from '@/data/core/taskList'
import { main } from '@/data/main'
import { setting } from '@/data/setting'

const props = defineProps<{
  id: string
}>()

const data = computed(() => {
  return main.data[props.id]
})

const log = ref<[msg: string, detail: string][]>([])

const controllerEl = ref<InstanceType<typeof MController> | null>(null)
const resourceEl = ref<InstanceType<typeof MResource> | null>(null)
const instanceEl = ref<InstanceType<typeof MInstance> | null>(null)

const instanceLoading = computed(() => {
  return instanceEl.value?.instanceLoading ?? false
})

const loadController = async () => {
  return !!(await controllerEl.value?.createController())
}

const loadResource = async () => {
  return !!(await resourceEl.value?.createResource())
}

const running = ref(false)

async function startRunImpl() {
  if (!data.value.config.instance.task) {
    console.log('failed for no task')
    return false
  }
  data.value.runtime.taskList = reactive(new TaskList())
  return (
    (await (
      await data.value.shallow.instance?.postTask(
        data.value.config.instance.task,
        data.value.config.instance.param ?? '{}'
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

const recoImages = ref<string[]>([])

async function showRecoResult(reco_id?: number) {
  if (typeof reco_id === 'undefined') {
    return
  }
  const imgs = await awaitUsing(async root => {
    const img_list = root.defer(new ImageListHandle())
    if (!(await img_list.create())) {
      return
    }
    if (!(await queryRecoDetail(reco_id, img_list)).return) {
      return
    }
    const imgs: string[] = []
    const size = await img_list.size()
    for (let i = 0; i < size; i++) {
      const img = await img_list.at(i)
      imgs.push(await img.encoded(false))
    }
    return imgs
  })
  if (imgs) {
    recoImages.value = imgs
  }
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
            <m-controller
              ref="controllerEl"
              :id="id"
              :instance-loading="instanceLoading"
              @log="(msg, detail) => log.push([msg, detail])"
            ></m-controller>
            <m-resource
              ref="resourceEl"
              :id="id"
              :instance-loading="instanceLoading"
              @log="(msg, detail) => log.push([msg, detail])"
            ></m-resource>
            <m-instance
              ref="instanceEl"
              :id="id"
              :load-controller="loadController"
              :load-resource="loadResource"
              :running="running"
              @log="
                (msg, detail) => {
                  log.push([msg, detail])
                  data.runtime.taskList?.push(msg as Message, JSON.parse(detail))
                }
              "
            ></m-instance>
            <n-card>
              <template #header>
                <div class="flex items-center gap-2">
                  <span> launch </span>
                </div>
              </template>
              <div class="maa-form">
                <span> task </span>
                <n-input v-model:value="data.config.instance.task" placeholder=""></n-input>
                <span> param </span>
                <n-input v-model:value="data.config.instance.param" placeholder=""></n-input>
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
              <div v-if="data.runtime.taskList" class="flex flex-wrap gap-2 mt-2">
                <div
                  v-for="(node, idx) in data.runtime.taskList.node"
                  :key="idx"
                  class="flex flex-col"
                >
                  <div class="flex flex-col gap-2 border p-2">
                    <span class="font-bold self-center"> {{ node.pre_hit_task }} </span>
                    <template v-for="(reco, ridx) in node.reco_list" :key="ridx">
                      <n-button @click="showRecoResult(reco.reco_id)">
                        <span v-if="reco.status === 'pending'" class="text-slate-500">
                          {{ reco.task }} {{ reco.reco_id ?? '' }}
                        </span>
                        <span v-else-if="reco.status === 'success'" class="text-green-500">
                          {{ reco.task }} {{ reco.reco_id ?? '' }}
                        </span>
                        <span v-else-if="reco.status === 'failed'" class="text-red-500">
                          {{ reco.task }} {{ reco.reco_id ?? '' }}
                        </span>
                      </n-button>
                    </template>
                  </div>
                </div>
              </div>
              <div v-if="recoImages" class="flex flex-col gap-2 mt-2">
                <img
                  v-for="(img, idx) in recoImages"
                  :key="idx"
                  :src="`data:image/png;base64,${img}`"
                />
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

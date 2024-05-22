<script setup lang="ts">
import { ImageListHandle, Message, Status, awaitUsing, queryRecoDetail } from '@nekosu/maa'
import { NButton, NCard, NCode, NDivider, NInput, NSplit } from 'naive-ui'
import { computed, reactive, ref } from 'vue'

import MController from '@/components/maa/MController.vue'
import MInstance from '@/components/maa/MInstance.vue'
import MRecoResult from '@/components/maa/MRecoResult.vue'
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
const recoResultEl = ref<InstanceType<typeof MRecoResult> | null>(null)

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

function addLog(msg: string, detail: string) {
  log.value.push([msg, JSON.stringify(JSON.parse(detail), null, 2)])
}
</script>

<template>
  <m-reco-result ref="recoResultEl"></m-reco-result>

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
              @log="addLog"
            ></m-controller>
            <m-resource
              ref="resourceEl"
              :id="id"
              :instance-loading="instanceLoading"
              @log="addLog"
            ></m-resource>
            <m-instance
              ref="instanceEl"
              :id="id"
              :load-controller="loadController"
              :load-resource="loadResource"
              :running="running"
              @log="
                (msg, detail) => {
                  addLog(msg, detail)
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
                      <n-button @click="recoResultEl?.showRecoResult(reco.reco_id)">
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
            </n-card>
          </div>
        </div>
      </template>
      <template #2>
        <div class="w-full h-full overflow-y-auto">
          <div class="flex flex-col gap-1 px-1">
            <template v-for="(msg, idx) in log" :key="idx">
              <span> {{ msg[0] }} </span>
              <n-code :code="msg[1]" language="json" word-wrap> </n-code>
            </template>
          </div>
        </div>
      </template>
    </n-split>
  </div>
</template>

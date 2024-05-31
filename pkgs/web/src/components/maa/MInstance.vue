<script setup lang="ts">
import { Instance, type TrivialCallbackFunc } from '@nekosu/maa'
import { NButton, NCard } from 'naive-ui'
import { computed, ref } from 'vue'

import { main } from '@/data/main'

const props = defineProps<{
  id: string
  loadController: () => Promise<boolean>
  loadResource: () => Promise<boolean>
  running: boolean
}>()

const emits = defineEmits<{
  log: [string, string]
}>()

const data = computed(() => {
  return main.data[props.id]
})

const instanceLoading = ref(false)

async function createInstanceImpl() {
  const cb: TrivialCallbackFunc = async (msg, detail) => {
    emits('log', msg, detail)
  }
  const inst = new Instance()
  if (!(await inst.create(cb))) {
    console.log('create failed')
    return false
  }
  if (!data.value.shallow.controller && !(await props.loadController())) {
    console.log('failed for controller')
    return false
  }
  if (!data.value.shallow.resource && !(await props.loadResource())) {
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
    data.value.shallow.instance = inst
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
  delete data.value.shallow.instance
}

async function disposeInstance() {
  instanceLoading.value = true
  const ret = await disposeInstanceImpl()
  instanceLoading.value = false
  return ret
}

defineExpose({
  instanceLoading
})
</script>

<template>
  <n-card>
    <template #header>
      <div class="flex items-center gap-2">
        <n-button v-if="!data.shallow.instance" @click="createInstance" :loading="instanceLoading">
          connect
        </n-button>
        <n-button v-else @click="disposeInstance" :loading="instanceLoading" :disabled="running">
          disconnect
        </n-button>
        <span> instance </span>
      </div>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { Resource, Status, type TrivialCallbackFunc } from '@nekosu/maa'
import { NButton, NCard, NInput } from 'naive-ui'
import { computed, ref } from 'vue'

import { main } from '@/data/main'

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

const resourceLoading = ref(false)

async function createResourceImpl() {
  const cb: TrivialCallbackFunc = async (msg, detail) => {
    emits('log', msg, detail)
  }
  if (!data.value.config.resource.path) {
    console.log('check path failed')
    return false
  }
  const res = new Resource()
  if (!(await res.create(cb))) {
    console.log('create failed')
    return false
  }
  if ((await (await res.postPath(data.value.config.resource.path)).wait()) === Status.Success) {
    data.value.shallow.resource = res
    return true
  } else {
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
  delete data.value.shallow.resource
}

async function disposeResource() {
  resourceLoading.value = true
  const ret = await disposeResourceImpl()
  resourceLoading.value = false
  return ret
}

defineExpose({
  createResource
})
</script>

<template>
  <n-card>
    <template #header>
      <div class="flex items-center gap-2">
        <n-button v-if="!data.shallow.resource" @click="createResource" :loading="resourceLoading">
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
        v-model:value="data.config.resource.path"
        placeholder=""
        :disabled="resourceLoading || !!data.shallow.resource"
      ></n-input>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { NButton, NCard, NInput, NInputNumber, NSwitch } from 'naive-ui'
import { ref } from 'vue'

import { maa } from '@/data/maa'
import { setting } from '@/data/setting'

const loading = ref(false)

async function tryInit() {
  loading.value = true
  await maa.init()
  loading.value = false
}

async function tryDeinit() {
  loading.value = true
  await maa.deinit()
  loading.value = false
}
</script>

<template>
  <div class="flex-1 flex flex-col items-center">
    <div class="container flex flex-col gap-4 p-4">
      <n-card title="Maa Http">
        <div class="maa-form">
          <div></div>
          <div>
            <n-button v-if="!maa.active" @click="tryInit" :loading="loading" type="primary">
              connect
            </n-button>
            <n-button v-else @click="tryDeinit" :loading="loading" type="primary">
              disconnect
            </n-button>
          </div>
          <span> Direct </span>
          <div>
            <n-switch
              v-model:value="setting.directSlave"
              :disabled="loading || maa.active"
            ></n-switch>
          </div>
          <span> Port </span>
          <n-input-number
            v-model:value="setting.port"
            placeholder=""
            min="0"
            max="65535"
            :disabled="loading || maa.active"
          ></n-input-number>
        </div>
      </n-card>
      <n-card title="Maa">
        <div class="maa-form">
          <span>Agent Path</span>
          <n-input v-model:value="setting.agentPath" placeholder=""></n-input>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NInput, NInputNumber } from 'naive-ui'

import { setting } from '@/data/setting'
</script>

<template>
  <div class="flex-1 flex flex-col items-center">
    <div class="container flex flex-col p-4">
      <div class="grid items-center gap-2" style="grid-template-columns: max-content auto">
        <span>Maa Http Port</span>
        <n-input-number
          v-model:value="setting.port"
          placeholder=""
          min="0"
          max="65535"
        ></n-input-number>
        <span>Agent Path</span>
        <n-input v-model:value="setting.agentPath" placeholder=""></n-input>
      </div>
    </div>
  </div>
</template>

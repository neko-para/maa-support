<script setup lang="ts">
import { NCard } from 'naive-ui'

import { maa } from '@/data/maa'
</script>

<template>
  <div
    class="bg-opacity-50 bg-black absolute z-10 w-full h-full flex flex-col items-center justify-center"
    v-show="!maa.active"
  >
    <n-card class="max-w-96"> MaaHttp not available </n-card>
  </div>
</template>

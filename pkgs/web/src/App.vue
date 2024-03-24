<script setup lang="ts">
import { NLayout, NLayoutContent, NLayoutHeader } from 'naive-ui'
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="w-screen h-screen flex gap-2">
    <div class="w-12 bg-slate-200"></div>
    <div class="w-36"></div>
    <div>
      <router-view></router-view>
    </div>
  </div>
</template>

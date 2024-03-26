<script setup lang="ts">
import { NButton, NLayoutContent, NLayoutHeader } from 'naive-ui'
import { type Component, computed, ref } from 'vue'

import MIcon from './components/MIcon.vue'
import VMain from './view/VMain.vue'
import VSetting from './view/VSetting.vue'

type TopLevelRoute = 'main' | 'setting'

const topLevelRoute = ref<TopLevelRoute>('main')

const routes = [
  {
    key: 'main',
    icon: 'home',
    comp: VMain
  },
  {
    key: 'setting',
    icon: 'settings',
    comp: VSetting
  }
] satisfies {
  key: TopLevelRoute
  icon: string
  comp: Component
}[]

const getComp = computed(() => {
  return routes.find(x => x.key === topLevelRoute.value)!.comp
})
</script>

<template>
  <div class="w-screen h-screen flex">
    <div class="bg-slate-200 flex flex-col gap-2 p-2 w-16">
      <div
        class="flex p-2 rounded-lg"
        v-for="r in routes"
        :key="r.key"
        :style="{
          backgroundColor: topLevelRoute == r.key ? 'rgba(1,1,1,0.1)' : 'transparent'
        }"
      >
        <n-button text @click="topLevelRoute = r.key" :focusable="false">
          <m-icon :opsz="32"> {{ r.icon }} </m-icon>
        </n-button>
      </div>
    </div>
    <component class="flex-1" :is="getComp"></component>
  </div>
</template>

<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import hljsJson from 'highlight.js/lib/languages/json'
import { NButton, NConfigProvider, NDialogProvider } from 'naive-ui'
import { type Component, computed, ref } from 'vue'

import MIcon from './components/MIcon.vue'
import VEdit from './view/VEdit.vue'
import VMain from './view/VMain.vue'
import VSetting from './view/VSetting.vue'

hljs.registerLanguage('json', hljsJson)

type TopLevelRoute = 'main' | 'edit' | 'setting'

const topLevelRoute = ref<TopLevelRoute>('edit')

type RouteInfo = {
  key: TopLevelRoute
  icon: string
  comp: Component
}

const routes = [
  {
    key: 'main',
    icon: 'home',
    comp: VMain
  },
  {
    key: 'edit',
    icon: 'edit',
    comp: VEdit
  },
  {
    key: 'setting',
    icon: 'settings',
    comp: VSetting
  }
] satisfies RouteInfo[] as RouteInfo[]

const getComp = computed(() => {
  return routes.find(x => x.key === topLevelRoute.value)!.comp
})
</script>

<template>
  <n-config-provider :hljs="hljs">
    <n-dialog-provider>
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
    </n-dialog-provider>
  </n-config-provider>
</template>

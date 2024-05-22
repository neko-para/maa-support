<script setup lang="tsx">
import hljs from 'highlight.js/lib/core'
import hljsJson from 'highlight.js/lib/languages/json'
import { NButton, NConfigProvider, NDialogProvider } from 'naive-ui'
import { type Component, h, ref } from 'vue'

import MComp from './components/MComp.vue'
import MIcon from './components/MIcon.vue'
import VEdit from './view/VEdit.vue'
import VMain from './view/VMain.vue'
import VSetting from './view/VSetting.vue'

hljs.registerLanguage('json', hljsJson)

type TopLevelRoute = 'main' | 'edit' | 'setting'

const topLevelRoute = ref<TopLevelRoute>('setting')

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

const navComp = () => {
  return routes.map(x => {
    // 这玩意直接写<x.comp>会报错，虽然实际上能跑
    return <MComp comp={x.comp} v-show={x.key === topLevelRoute.value} class="flex-1"></MComp>
  })
}
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
        <navComp></navComp>
      </div>
    </n-dialog-provider>
  </n-config-provider>
</template>

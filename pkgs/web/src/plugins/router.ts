import { type RouteRecordRaw, createMemoryHistory, createRouter } from 'vue-router'

import VSetting from '@/view/VSetting.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: VSetting
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router

<script setup lang="ts">
import { NButton, NSplit } from 'naive-ui'
import { ref } from 'vue'

import MIcon from '@/components/MIcon.vue'
import { main } from '@/data/main'

import VMainCore from './main/VMainCore.vue'

const currentId = ref<string | null>(main.active && main.active in main.data ? main.active : null)

function tryDel(id: string) {
  if (currentId.value === id) {
    currentId.value = null
  }
  if (main.active === id) {
    delete main.active
  }
  const idx = main.ids.indexOf(id)
  if (idx !== -1) {
    main.ids.splice(idx, 1)
  }
  delete main.data[id]
}
</script>

<template>
  <n-split :min="0.2" :max="0.4" :default-size="0.2">
    <template #1>
      <div class="flex flex-col gap-2 p-4">
        <div class="flex gap-2">
          <n-button @click="main.add()">
            <m-icon> add </m-icon>
          </n-button>
        </div>
        <template v-for="id in main.ids" :key="id">
          <div class="flex gap-2">
            <n-button
              @click="
                () => {
                  currentId = null
                  main.active = id
                  $nextTick(() => {
                    currentId = id
                  })
                }
              "
              class="flex-1"
              :type="currentId === id ? 'primary' : 'default'"
            >
              {{ main.data[id].name }}
            </n-button>
            <n-button @click="tryDel(id)" class="flex-grow-0">
              <m-icon> close </m-icon>
            </n-button>
          </div>
        </template>
      </div>
    </template>
    <template #2>
      <v-main-core v-if="currentId" :id="currentId"></v-main-core>
      <div v-else>select or create instance to continue</div>
    </template>
  </n-split>
</template>

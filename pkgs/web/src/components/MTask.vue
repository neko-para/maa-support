<script setup lang="ts">
import { NButton, NSelect, NSwitch } from 'naive-ui'

import { editor } from '@/data/editor'
import type { Task } from '@/types'
import { makeProp } from '@/utils/property'

import MApp from './task/MApp.vue'
import MClick from './task/MClick.vue'
import MColorMatch from './task/MColorMatch.vue'
import MCustomAction from './task/MCustomAction.vue'
import MCustomReco from './task/MCustomReco.vue'
import { MNextEdit } from './task/MEdits'
import MFeatureMatch from './task/MFeatureMatch.vue'
import MInputText from './task/MInputText.vue'
import MKey from './task/MKey.vue'
import MMultiEdit from './task/MMultiEdit.vue'
import MOcr from './task/MOcr.vue'
import MSwipe from './task/MSwipe.vue'
import MTemplateMatch from './task/MTemplateMatch.vue'

type TaskType = Partial<Task>

const props = defineProps<{
  task: TaskType
}>()

function make<K extends keyof TaskType>(key: K) {
  return makeProp(() => props.task, key)
}

const recognitionOptions = [
  'DirectHit',
  'TemplateMatch',
  'FeatureMatch',
  'ColorMatch',
  'OCR',
  'NeuralNetworkClassify',
  'NeuralNetworkDetect',
  'Custom'
].map(x => ({
  label: x,
  value: x
}))

const actionOptions = [
  'DoNothing',
  'Click',
  'Swipe',
  'Key',
  'InputText',
  'StartApp',
  'StopApp',
  'StopTask',
  'Custom'
].map(x => ({
  label: x,
  value: x
}))

const recognition = make('recognition')
const action = make('action')
const next = make('next')
const is_sub = make('is_sub')
const inverse = make('inverse')
const enabled = make('enabled')
const focus = make('focus')
</script>

<template>
  <div class="maa-form">
    <template v-if="!editor.hideUnset || 'recognition' in task">
      <n-button @click="recognition = null"> recognition </n-button>
      <n-select v-model:value="recognition" :options="recognitionOptions" placeholder=""></n-select>
    </template>

    <template v-if="task.recognition === 'TemplateMatch'">
      <m-template-match :task="task"></m-template-match>
    </template>
    <template v-else-if="task.recognition === 'FeatureMatch'">
      <m-feature-match :task="task"></m-feature-match>
    </template>
    <template v-else-if="task.recognition === 'ColorMatch'">
      <m-color-match :task="task"></m-color-match>
    </template>
    <template v-else-if="task.recognition === 'OCR'">
      <m-ocr :task="task"></m-ocr>
    </template>
    <template v-else-if="task.recognition === 'Custom'">
      <m-custom-reco :task="task"></m-custom-reco>
    </template>

    <template v-if="!editor.hideUnset || 'action' in task">
      <n-button @click="action = null"> action </n-button>
      <n-select v-model:value="action" :options="actionOptions" placeholder=""></n-select>
    </template>

    <template v-if="task.action === 'Click'">
      <m-click :task="task"></m-click>
    </template>
    <template v-else-if="task.action === 'Swipe'">
      <m-swipe :task="task"></m-swipe>
    </template>
    <template v-else-if="task.action === 'Key'">
      <m-key :task="task"></m-key>
    </template>
    <template v-else-if="task.action === 'InputText'">
      <m-input-text :task="task"></m-input-text>
    </template>
    <template v-else-if="task.action === 'StartApp' || task.action === 'StopApp'">
      <m-app :task="task"></m-app>
    </template>
    <template v-else-if="task.action === 'Custom'">
      <m-custom-action :task="task"></m-custom-action>
    </template>

    <template v-if="!editor.hideUnset || 'next' in task">
      <n-button @click="next = null"> next </n-button>
      <m-multi-edit
        v-model:value="next"
        :test="v => Array.isArray(v)"
        :def="() => ''"
        :render="MNextEdit"
      ></m-multi-edit>
    </template>

    <template v-if="!editor.hideUnset || 'is_sub' in task">
      <n-button @click="is_sub = null"> is_sub </n-button>
      <div>
        <n-switch
          :value="is_sub ?? false"
          @update:value="
            v => {
              is_sub = !!v
            }
          "
        ></n-switch>
      </div>
    </template>
    <template v-if="!editor.hideUnset || 'inverse' in task">
      <n-button @click="inverse = null"> inverse </n-button>
      <div>
        <n-switch
          :value="inverse ?? false"
          @update:value="
            v => {
              inverse = !!v
            }
          "
        ></n-switch>
      </div>
    </template>
    <template v-if="!editor.hideUnset || 'enabled' in task">
      <n-button @click="enabled = null"> enabled </n-button>
      <div>
        <n-switch
          :value="enabled ?? true"
          @update:value="
            v => {
              enabled = !!v
            }
          "
        ></n-switch>
      </div>
    </template>
    <template v-if="!editor.hideUnset || 'focus' in task">
      <n-button @click="focus = null"> focus </n-button>
      <div>
        <n-switch
          :value="focus ?? false"
          @update:value="
            v => {
              focus = !!v
            }
          "
        ></n-switch>
      </div>
    </template>
  </div>
</template>

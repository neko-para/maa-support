<script setup lang="ts">
import {
  type HwndId,
  type Win32Config,
  Win32Type,
  type Win32TypeKey,
  type Win32TypeScreencap,
  type Win32TypeTouch,
  fromWin32Type,
  toWin32Type
} from '@maa/maa'
import { NInput, NSelect } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  value?: Partial<Win32Config>
  disabled?: boolean
}>()

const emits = defineEmits<{
  'update:value': [Partial<Win32Config> | undefined]
}>()

const touchOpts = ['send message'].map(x => ({
  label: x,
  value: x
}))

const keyOpts = ['send message'].map(x => ({
  label: x,
  value: x
}))

const screencapOpts = ['gdi', 'dxgi desktop dup', 'dxgi frame pool'].map(x => ({
  label: x,
  value: x
}))

const win32_type = computed<Win32Type | undefined>({
  set(type) {
    emits('update:value', {
      ...props.value,
      type
    })
  },
  get() {
    return props.value?.type
  }
})

const win32_type_touch = computed<Win32TypeTouch | undefined>({
  set(type) {
    win32_type.value = toWin32Type(type, win32_type_key.value, win32_type_screencap.value)
  },
  get() {
    return fromWin32Type(win32_type.value ?? 0).touch
  }
})

const win32_type_key = computed<Win32TypeKey | undefined>({
  set(type) {
    win32_type.value = toWin32Type(win32_type_touch.value, type, win32_type_screencap.value)
  },
  get() {
    return fromWin32Type(win32_type.value ?? 0).key
  }
})

const win32_type_screencap = computed<Win32TypeScreencap | undefined>({
  set(type) {
    win32_type.value = toWin32Type(win32_type_touch.value, win32_type_key.value, type)
  },
  get() {
    return fromWin32Type(win32_type.value ?? 0).screencap
  }
})
</script>

<template>
  <div class="maa-form">
    <span> hwnd </span>
    <n-input
      :value="value?.hwnd"
      @update:value="v => $emit('update:value', { ...value, hwnd: v as string as HwndId })"
      :disabled="disabled"
      placeholder=""
    ></n-input>
    <span> type </span>
    <div class="flex gap-2">
      <n-select
        v-model:value="win32_type_touch"
        :options="touchOpts"
        :disabled="disabled"
        placeholder=""
      ></n-select>
      <n-select
        v-model:value="win32_type_key"
        :options="keyOpts"
        :disabled="disabled"
        placeholder=""
      ></n-select>
      <n-select
        v-model:value="win32_type_screencap"
        :options="screencapOpts"
        :disabled="disabled"
        placeholder=""
      ></n-select>
    </div>
  </div>
</template>

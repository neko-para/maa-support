<script setup lang="ts">
import {
  type AdbConfig,
  type AdbType,
  type AdbTypeKey,
  type AdbTypeScreencap,
  type AdbTypeTouch,
  fromAdbType,
  toAdbType
} from '@maa/maa'
import { NInput, NSelect } from 'naive-ui'
import { computed } from 'vue'

const props = defineProps<{
  value: Partial<AdbConfig>
  disabled?: boolean
}>()

const emits = defineEmits<{
  'update:value': [Partial<AdbConfig>]
}>()

const touchOpts = ['adb', 'mini touch', 'maa touch', 'auto detect'].map(x => ({
  label: x,
  value: x
}))

const keyOpts = ['adb', 'maa touch', 'auto detect'].map(x => ({
  label: x,
  value: x
}))

const screencapOpts = [
  'raw by netcat',
  'raw with gzip',
  'encode',
  'encode to file',
  'minicap direct',
  'minicap stream',
  'fastest lossless way',
  'fastest way'
].map(x => ({
  label: x,
  value: x
}))

const adb_type = computed<AdbType | undefined>({
  set(type) {
    emits('update:value', {
      ...props.value,
      type
    })
  },
  get() {
    return props.value.type
  }
})

const adb_type_touch = computed<AdbTypeTouch | undefined>({
  set(type) {
    adb_type.value = toAdbType(type, adb_type_key.value, adb_type_screencap.value)
  },
  get() {
    return fromAdbType(adb_type.value ?? 0).touch
  }
})

const adb_type_key = computed<AdbTypeKey | undefined>({
  set(type) {
    adb_type.value = toAdbType(adb_type_touch.value, type, adb_type_screencap.value)
  },
  get() {
    return fromAdbType(adb_type.value ?? 0).key
  }
})

const adb_type_screencap = computed<AdbTypeScreencap | undefined>({
  set(type) {
    adb_type.value = toAdbType(adb_type_touch.value, adb_type_key.value, type)
  },
  get() {
    return fromAdbType(adb_type.value ?? 0).screencap
  }
})
</script>

<template>
  <div class="maa-form">
    <span> adb </span>
    <n-input
      :value="value.adb_path"
      @update:value="v => $emit('update:value', { ...value, adb_path: v })"
      :disabled="disabled"
      placeholder=""
    ></n-input>
    <span> address </span>
    <n-input
      :value="value.address"
      @update:value="v => $emit('update:value', { ...value, address: v })"
      :disabled="disabled"
      placeholder=""
    ></n-input>
    <span> type </span>
    <div class="flex gap-2">
      <n-select
        v-model:value="adb_type_touch"
        :options="touchOpts"
        :disabled="disabled"
        placeholder=""
      ></n-select>
      <n-select
        v-model:value="adb_type_key"
        :options="keyOpts"
        :disabled="disabled"
        placeholder=""
      ></n-select>
      <n-select
        v-model:value="adb_type_screencap"
        :options="screencapOpts"
        :disabled="disabled"
        placeholder=""
      ></n-select>
    </div>
    <span> config </span>
    <n-input
      :value="value.config"
      @update:value="v => $emit('update:value', { ...value, config: v })"
      :disabled="disabled"
      placeholder=""
    ></n-input>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  comp: Component
}>()
</script>

<template>
  <component :is="comp"></component>
</template>

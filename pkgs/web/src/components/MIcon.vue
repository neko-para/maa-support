<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'outlined' | 'rounded' | 'sharp'
    fill?: number
    wght?: 100 | 200 | 300 | 400 | 500 | 600 | 700
    grad?: -25 | 0 | 200
    opsz?: number
  }>(),
  {
    type: 'outlined',
    fill: 0,
    wght: 400,
    grad: 0,
    opsz: 24
  }
)
</script>

<template>
  <div class="flex flex-grow-0 flex-shrink-0">
    <span
      :class="`material-symbols-${type}`"
      :style="{
        'font-variation-settings': `'FILL' ${fill}, 'wght' ${wght}, 'GRAD' ${grad}, 'opsz' ${opsz}`,
        'font-size': `${opsz}px`
      }"
    >
      <slot></slot>
    </span>
  </div>
</template>

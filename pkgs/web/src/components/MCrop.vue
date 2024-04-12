<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

const image = ref<string | null>(null)
const imageEl = shallowRef<HTMLImageElement | null>(null)
const loading = ref(false)
const width = ref(0)
const height = ref(0)

async function setImage(url: string) {
  if (loading.value) {
    return false
  }
  loading.value = true
  if (image.value) {
    URL.revokeObjectURL(image.value)
  }
  image.value = url
  if (!imageEl.value) {
    imageEl.value = new Image()
  }
  imageEl.value.src = image.value
  await new Promise(resolve => {
    imageEl.value!.onload = resolve
  })
  loading.value = false

  width.value = imageEl.value.width
  height.value = imageEl.value.height

  return true
}

onUnmounted(() => {
  if (image.value) {
    URL.revokeObjectURL(image.value)
  }
})

defineExpose({
  setImage,
  loading
})

const canvasEl = ref<HTMLCanvasElement | null>(null)

const offsetX = ref(0)
const offsetY = ref(0)
const trackX = ref(0)
const trackY = ref(0)
const trackBaseX = ref(0)
const trackBaseY = ref(0)
const tracking = ref(false)
const scale = ref(1)

const clipLeft = ref(0)
const clipRight = ref(0)
const clipTop = ref(0)
const clipBottom = ref(0)
const clipping = ref(false)

function onScroll(ev: WheelEvent) {
  if (ev.deltaY > 0) {
    scale.value *= 1.1
  } else {
    scale.value /= 1.1
  }
}

function onMouseDown(ev: PointerEvent) {
  if (ev.button === 0) {
    trackBaseX.value = offsetX.value
    trackBaseY.value = offsetY.value
    trackX.value = ev.offsetX
    trackY.value = ev.offsetX
    tracking.value = true
    canvasEl.value!.setPointerCapture(ev.pointerId)
  } else if (ev.button === 2) {
    clipLeft.value = clipRight.value = ev.offsetX - offsetX.value
    clipTop.value = clipBottom.value = ev.offsetY - offsetY.value
    clipping.value = true
    canvasEl.value!.setPointerCapture(ev.pointerId)
  }
}

function onMouseMove(ev: PointerEvent) {
  if (tracking.value) {
    offsetX.value = ev.offsetX - trackX.value + trackBaseX.value
    offsetY.value = ev.offsetY - trackY.value + trackBaseY.value
  } else if (clipping.value) {
    clipRight.value = ev.offsetX - offsetX.value
    clipBottom.value = ev.offsetY - offsetY.value
  }
}

function onMouseUp(ev: PointerEvent) {
  if (tracking.value && ev.button === 0) {
    tracking.value = false
    canvasEl.value!.releasePointerCapture(ev.pointerId)
  } else if (clipping.value && ev.button === 2) {
    clipping.value = false
    canvasEl.value!.releasePointerCapture(ev.pointerId)
  }
}

function draw(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'wheat'
  ctx.fillRect(0, 0, 640, 640)
  if (!imageEl.value) {
    return
  }
  ctx.drawImage(
    imageEl.value,
    0,
    0,
    width.value,
    height.value,
    offsetX.value,
    offsetY.value,
    width.value * scale.value,
    height.value * scale.value
  )
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.fillRect(
    offsetX.value + clipLeft.value,
    offsetY.value + clipTop.value,
    clipRight.value - clipLeft.value,
    clipBottom.value - clipTop.value
  )
}

let drawTimer: NodeJS.Timeout = 0 as unknown as NodeJS.Timeout

onMounted(() => {
  const ctx = canvasEl.value!.getContext('2d')
  if (ctx) {
    drawTimer = setInterval(() => draw(ctx), 20)
  }
})

onUnmounted(() => {
  if (drawTimer) {
    clearInterval(drawTimer)
  }
})
</script>

<template>
  <div>
    offset {{ offsetX }} {{ offsetY }}
    <br />
    {{ clipLeft }} {{ clipTop }} {{ clipRight }} {{ clipBottom }}

    <!-- <img v-if="image" :src="image" :width="expectSize[0]" :height="expectSize[1]" /> -->
    <canvas
      ref="canvasEl"
      :width="640"
      :height="640"
      @wheel="onScroll"
      @pointerdown="onMouseDown"
      @pointermove="onMouseMove"
      @pointerup="onMouseUp"
      @contextmenu.prevent=""
    ></canvas>
  </div>
</template>

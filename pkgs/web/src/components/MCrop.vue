<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

import { triggerDownload } from '@/utils/download'
import { CropContext, Pos, Viewport } from '@/utils/pos'

const canvasW = ref(0)
const canvasH = ref(0)

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

const canvasEl = ref<HTMLCanvasElement | null>(null)

const context = ref<CropContext>(new CropContext())
const tracking = ref(false)
const clipping = ref(false)
const current = ref<Pos>(new Pos())

function onScroll(ev: WheelEvent) {
  context.value.viewport.zoomAt(ev.deltaY > 0, Pos.fromEvent(ev))
}

function onMouseDown(ev: PointerEvent) {
  if (ev.button === 0) {
    context.value.viewport.startDrag(Pos.fromEvent(ev))
    tracking.value = true
    canvasEl.value!.setPointerCapture(ev.pointerId)
  } else if (ev.button === 2) {
    context.value.startClip(Pos.fromEvent(ev))
    clipping.value = true
    canvasEl.value!.setPointerCapture(ev.pointerId)
  }
}

function onMouseMove(ev: PointerEvent) {
  current.value = Pos.fromEvent(ev)
  if (tracking.value) {
    context.value.viewport.moveDrag(Pos.fromEvent(ev))
  } else if (clipping.value) {
    context.value.moveClip(Pos.fromEvent(ev))
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
  ctx.fillRect(0, 0, canvasW.value, canvasH.value)
  if (!imageEl.value) {
    return
  }
  ctx.drawImage(
    imageEl.value,
    0,
    0,
    width.value,
    height.value,
    ...context.value.viewport.imagePos(width.value, height.value)
  )
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.fillRect(...context.value.clipPos())
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.beginPath()
  ctx.moveTo(current.value.x, 0)
  ctx.lineTo(current.value.x, canvasH.value)
  ctx.moveTo(0, current.value.y)
  ctx.lineTo(canvasW.value, current.value.y)
  ctx.stroke()
}

let drawTimer: NodeJS.Timeout = 0 as unknown as NodeJS.Timeout

onMounted(() => {
  const resize = () => {
    const rec = canvasEl.value!.getBoundingClientRect()
    console.log(rec.width, rec.height)
    canvasW.value = rec.width
    canvasH.value = rec.height
    canvasEl.value!.width = rec.width
    canvasEl.value!.height = rec.height
  }
  window.onresize = resize
  resize()
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

async function getImage() {
  if (!image.value) {
    return null
  }
  context.value.ceilClip()
  context.value.boundClip(width.value, height.value)
  const cropPos = context.value.cropPos()
  if (cropPos[2] === 0 || cropPos[3] === 0) {
    return null
  }
  const buffer = await (await fetch(image.value)).arrayBuffer()
  const jimp = await Jimp.read(Buffer.from(buffer))
  const croped = jimp.crop(...cropPos)
  const result = await croped.getBufferAsync('image/png')

  const resultBlob = new Blob([result.buffer])
  const dataUrl = URL.createObjectURL(resultBlob)

  return dataUrl
}

async function download() {
  const dataUrl = await getImage()
  if (!dataUrl) {
    return
  }

  triggerDownload(dataUrl, 'result.png')

  URL.revokeObjectURL(dataUrl)
}

defineExpose({
  setImage,
  getImage,
  loading
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <pre>{{ context }}</pre>
    <div class="flex items-center gap-2">
      <n-button @click="() => context.viewport.reset()"> reset </n-button>
      <n-button @click="() => context.ceilClip()"> ceil </n-button>
      <n-button @click="() => context.boundClip(width, height)"> bound </n-button>
      <n-button @click="download"> download </n-button>
      <span> 左键拖动，右键裁剪；ceil对齐像素，bound移除出界范围 </span>
    </div>
    <canvas
      ref="canvasEl"
      class="flex-1"
      @wheel="onScroll"
      @pointerdown="onMouseDown"
      @pointermove="onMouseMove"
      @pointerup="onMouseUp"
      @contextmenu.prevent=""
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

import { Box, DragHandler, Pos, Size, Viewport } from '@/utils/2d'
import { triggerDownload } from '@/utils/download'

const canvasW = ref(0)
const canvasH = ref(0)

const image = ref<string | null>(null)
const imageEl = shallowRef<HTMLImageElement | null>(null)
const loading = ref(false)
const imageSize = ref<Size>(new Size())

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

  imageSize.value.set(imageEl.value.width, imageEl.value.height)

  return true
}

onUnmounted(() => {
  if (image.value) {
    URL.revokeObjectURL(image.value)
  }
})

const canvasSizeEl = ref<HTMLDivElement | null>(null)
const canvasEl = ref<HTMLCanvasElement | null>(null)

const viewport = ref<Viewport>(new Viewport())
const viewMoveDrag = ref<DragHandler>(new DragHandler())
const cropMoveDrag = ref<DragHandler>(new DragHandler())
const cropDrag = ref<DragHandler>(new DragHandler())
const cropBox = ref<Box>(new Box())
const current = ref<Pos>(new Pos())

const cropBoxView = computed<Box>({
  get() {
    return viewport.value.toView(cropBox.value)
  },
  set(b: Box) {
    cropBox.value = viewport.value.fromView(b)
  }
})

function onScroll(ev: WheelEvent) {
  viewport.value.zoom(ev.deltaY > 0, Pos.fromEvent(ev))
}

function onMouseDown(ev: PointerEvent) {
  const mp = Pos.fromEvent(ev)
  current.value = mp
  if (ev.button === 0) {
    if (cropBoxView.value.contains(mp)) {
      cropMoveDrag.value.down(mp, cropBoxView.value.origin)
      canvasEl.value!.setPointerCapture(ev.pointerId)
    }
  } else if (ev.button === 1) {
    viewMoveDrag.value.down(mp, viewport.value.offset)
    canvasEl.value!.setPointerCapture(ev.pointerId)
  } else if (ev.button === 2) {
    cropDrag.value.down(mp, mp)
    canvasEl.value!.setPointerCapture(ev.pointerId)
  }
}

function onMouseMove(ev: PointerEvent) {
  const mp = Pos.fromEvent(ev)
  current.value = mp
  if (cropMoveDrag.value.state) {
    cropMoveDrag.value.move(mp)
    cropBoxView.value = cropBoxView.value.copy().setOrigin(cropMoveDrag.value.current)
  } else if (viewMoveDrag.value.state) {
    viewMoveDrag.value.move(mp)
    viewport.value.offset = viewMoveDrag.value.current
  } else if (cropDrag.value.state) {
    cropDrag.value.move(mp)
    cropBoxView.value = cropDrag.value.box
  }
}

function onMouseUp(ev: PointerEvent) {
  if (cropMoveDrag.value.state && ev.button === 0) {
    cropMoveDrag.value.up()
    canvasEl.value!.releasePointerCapture(ev.pointerId)
  } else if (viewMoveDrag.value.state && ev.button === 1) {
    viewMoveDrag.value.up()
    canvasEl.value!.releasePointerCapture(ev.pointerId)
  } else if (cropDrag.value.state && ev.button === 2) {
    cropDrag.value.up()
    canvasEl.value!.releasePointerCapture(ev.pointerId)
  }
}

function draw(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'wheat'
  ctx.fillRect(0, 0, canvasW.value, canvasH.value)
  if (imageEl.value) {
    ctx.drawImage(
      imageEl.value,
      0,
      0,
      ...imageSize.value.flat(),
      ...viewport.value.toView(Box.from(new Pos(), imageSize.value)).flat()
    )
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.fillRect(...cropBoxView.value.flat())

  ctx.save()
  ctx.globalCompositeOperation = 'difference'
  ctx.strokeStyle = 'white'
  ctx.beginPath()
  if (1 / viewport.value.scale >= 4) {
    const pos = viewport.value.fromView(current.value).round()
    for (let dx = -10; dx <= 10; dx += 1) {
      for (let dy = -10; dy <= 10; dy += 1) {
        const dpos = viewport.value.toView(pos.add(Size.from(dx, dy)))
        ctx.moveTo(dpos.x, 0)
        ctx.lineTo(dpos.x, canvasH.value)
        ctx.moveTo(0, dpos.y)
        ctx.lineTo(canvasW.value, dpos.y)
      }
    }
  }
  ctx.stroke()
  ctx.restore()

  ctx.strokeStyle = 'rgba(255, 127, 127, 1)'
  ctx.beginPath()
  ctx.moveTo(current.value.x, 0)
  ctx.lineTo(current.value.x, canvasH.value)
  ctx.moveTo(0, current.value.y)
  ctx.lineTo(canvasW.value, current.value.y)
  ctx.stroke()
}

let drawTimer: NodeJS.Timeout = 0 as unknown as NodeJS.Timeout
let resizeObs: ResizeObserver

onMounted(() => {
  const ctx = canvasEl.value!.getContext('2d')!
  const resize = () => {
    const rec = canvasSizeEl.value!.getBoundingClientRect()
    console.log(rec.width, rec.height)
    canvasW.value = rec.width
    canvasH.value = rec.height
    canvasEl.value!.width = rec.width
    canvasEl.value!.height = rec.height
    draw(ctx)
  }
  resizeObs = new ResizeObserver(resize)
  resizeObs.observe(canvasSizeEl.value!)
  resize()
  drawTimer = setInterval(() => draw(ctx), 20)
})

onBeforeUnmount(() => {
  resizeObs.unobserve(canvasSizeEl.value!)
})

onUnmounted(() => {
  if (drawTimer) {
    clearInterval(drawTimer)
  }
})

function cropCeil() {
  cropBox.value.ceil()
}

function cropBound() {
  cropBox.value = cropBox.value.intersect(Box.from(new Pos(), imageSize.value))
}

async function getImage() {
  if (!image.value) {
    return null
  }
  cropCeil()
  cropBound()
  const cropPos = cropBox.value.flat()
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
  <div class="flex flex-col gap-2 flex-1">
    <pre>{{ viewport }}</pre>
    <pre>{{ cropBox }}</pre>
    <div class="flex items-center gap-2">
      <n-button @click="() => viewport.reset()"> reset </n-button>
      <n-button @click="cropCeil"> ceil </n-button>
      <n-button @click="cropBound"> bound </n-button>
      <n-button @click="download"> download </n-button>
      <span> 左键移动裁剪区域，中键移动视图，右键裁剪；ceil对齐像素，bound移除出界范围 </span>
    </div>
    <div ref="canvasSizeEl" class="relative flex-1">
      <canvas
        ref="canvasEl"
        class="absolute left-0 top-0"
        @wheel="onScroll"
        @pointerdown="onMouseDown"
        @pointermove="onMouseMove"
        @pointerup="onMouseUp"
        @contextmenu.prevent=""
      ></canvas>
    </div>
  </div>
</template>

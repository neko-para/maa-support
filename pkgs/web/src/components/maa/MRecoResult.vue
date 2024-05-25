<script setup lang="ts">
import { ImageListHandle, awaitUsing, queryRecoDetail } from '@nekosu/maa'
import { NCard, NCode, NModal } from 'naive-ui'
import { ref } from 'vue'

import type { Rect } from '@/types'

const showModal = ref(false)

const recoHit = ref(false)
const recoBox = ref<Rect>([0, 0, 0, 0])
const recoDetail = ref<string>('')
const recoImages = ref<string[]>([])

async function showRecoResult(reco_id?: number) {
  if (typeof reco_id === 'undefined') {
    return
  }
  const imgs = await awaitUsing(async root => {
    const img_list = root.transfer(new ImageListHandle())
    if (!(await img_list.create())) {
      return
    }
    const detail = await queryRecoDetail(reco_id, img_list)
    if (!detail.return) {
      return
    }
    recoHit.value = detail.hit
    recoBox.value = [
      detail.hit_box.x,
      detail.hit_box.y,
      detail.hit_box.width,
      detail.hit_box.height
    ]
    try {
      recoDetail.value = JSON.stringify(JSON.parse(detail.detail_json), null, 2)
    } catch (err) {
      console.log(detail.detail_json, err)
      recoDetail.value = detail.detail_json
    }
    const imgs: string[] = []
    const size = await img_list.size()
    for (let i = 0; i < size; i++) {
      const img = await img_list.at(i)
      imgs.push(await img.encoded(false))
      img.unref()
    }
    return imgs
  })
  if (imgs) {
    recoImages.value = imgs
  }
  showModal.value = true
}

defineExpose({
  showRecoResult
})
</script>

<template>
  <n-modal v-model:show="showModal">
    <n-card
      style="max-width: 90vw; margin-top: 5vh; max-height: 90vh; overflow-y: auto"
      role="dialog"
    >
      <div class="maa-form">
        <span> Hit </span>
        <span> {{ recoHit }} </span>
        <span> Box </span>
        <span> {{ recoBox }} </span>
        <span> Detail </span>
        <n-code :code="recoDetail" language="json"></n-code>
        <span> Images </span>
        <div class="flex flex-col gap-2">
          <img v-for="(img, idx) in recoImages" :key="idx" :src="`data:image/png;base64,${img}`" />
        </div>
      </div>
    </n-card>
  </n-modal>
</template>

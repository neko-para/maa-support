import { Buffer } from 'buffer'
import 'jimp/browser/lib/jimp.js'
import 'material-symbols'
import { createApp } from 'vue'

import App from '@/App.vue'
import '@/assets/base.css'
import { maa } from '@/data/maa'

// @ts-ignore
globalThis.Buffer = Buffer

const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

maa.init()

window.onbeforeunload = () => {
  maa.deinit()
}

createApp(App).mount('#app')

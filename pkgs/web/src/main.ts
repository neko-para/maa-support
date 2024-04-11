import { Buffer } from 'buffer'
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

createApp(App).mount('#app')

import 'material-symbols'
import { createApp } from 'vue'

import App from '@/App.vue'
import '@/assets/base.css'

import router from './plugins/router'

const meta = document.createElement('meta')
meta.name = 'naive-ui-style'
document.head.appendChild(meta)

createApp(App).use(router).mount('#app')

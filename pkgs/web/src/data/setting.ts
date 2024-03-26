import { reactive, watch } from 'vue'

type DataSetting = {
  port?: number
  agentPath?: string
}

export const setting = reactive<DataSetting>({})

watch(
  setting,
  v => {
    localStorage.setItem('setting', JSON.stringify(v))
  },
  {
    deep: true
  }
)

if (localStorage.getItem('setting')) {
  Object.assign(setting, JSON.parse(localStorage.getItem('setting') as string))
}

setting.port = setting.port ?? 13126

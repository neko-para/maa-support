import { setBaseURL } from '@maa/schema'
import axios from 'axios'

let port: number | null = null
let heart: NodeJS.Timeout

function localhost(port: number) {
  return `http://127.0.0.1:${port}`
}

export async function init(masterPort: number) {
  if (port) {
    deinit(masterPort)
  }
  const res = (
    await axios({
      baseURL: localhost(masterPort),
      url: '/start'
    })
  ).data as { port: number | null }
  if (res.port) {
    port = res.port
    setBaseURL(localhost(port))
    heart = setInterval(() => {
      axios({
        baseURL: localhost(masterPort),
        url: '/heart',
        data: {
          port
        }
      })
    }, 10000)
    return true
  } else {
    return false
  }
}

export async function deinit(masterPort: number) {
  await axios({
    baseURL: localhost(masterPort),
    url: '/stop',
    data: {
      port
    }
  })
  port = null
  clearInterval(heart)
}

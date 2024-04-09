import axios from 'axios'

import { setBaseURL } from './schema'

let port: number | null = null
let heart: NodeJS.Timeout

function localhost(port: number) {
  return `http://127.0.0.1:${port}`
}

export async function init(masterPort: number, heartLoss: () => void) {
  if (port) {
    deinit(masterPort)
  }
  try {
    const res = (
      await axios({
        baseURL: localhost(masterPort),
        url: '/start',
        method: 'post'
      })
    ).data as { port: number | null }
    if (res.port) {
      const heartFail = () => {
        port = null
        clearInterval(heart)
        heartLoss()
      }
      port = res.port
      setBaseURL(localhost(port))
      heart = setInterval(async () => {
        try {
          const res = (
            await axios({
              baseURL: localhost(masterPort),
              url: '/heart',
              method: 'post',
              data: {
                port
              }
            })
          ).data as { success: boolean }

          if (!res.success) {
            heartFail()
          }
        } catch (_) {
          heartFail()
        }
      }, 10000)
      return true
    } else {
      return false
    }
  } catch (_) {
    return false
  }
}

export async function deinit(masterPort: number) {
  await axios({
    baseURL: localhost(masterPort),
    url: '/stop',
    method: 'post',
    data: {
      port
    }
  })
  port = null
  clearInterval(heart)
}

export function initDirect(slavePort: number) {
  port = slavePort
}

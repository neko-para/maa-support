import { deinit, init } from '..'
import type { AdbController } from '../src/wrapper/controller'
import { Image } from '../src/wrapper/image'

async function main() {
  await init(13126, () => void 0)

  await using img = new Image()
  await img.create()
}

main().then(() => {
  globalThis.gc?.()
})

setTimeout(() => {
  deinit(13126)
}, 10000)

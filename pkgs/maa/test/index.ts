import { deinit, init } from '..'
import { AdbController } from '../src/wrapper/controller'

async function main() {
  await init(13126)

  const ctrl = new AdbController()

  ctrl.dispose()

  await deinit(13126)
}

main()

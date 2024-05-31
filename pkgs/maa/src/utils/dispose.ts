const finalizer = new FinalizationRegistry((func: () => void) => {
  func()
})

export class __Disposable {
  __dispose_action: (() => void)[] = []

  constructor() {
    const actions = this.__dispose_action
    finalizer.register(
      this,
      () => {
        for (const act of actions) {
          act()
        }
        console.log('disposed!')
      },
      this
    )
  }

  __defer(action: () => void) {
    this.__dispose_action.push(action)
  }
}

/*
function main() {
  class A extends __Disposable {
    constructor() {
      super()
      this.__defer(() => {
        console.log('disposed!')
      })
    }
  }

  const a = new A()
  globalThis.gc?.()

  setTimeout(() => {}, 10000)
}

main()
*/

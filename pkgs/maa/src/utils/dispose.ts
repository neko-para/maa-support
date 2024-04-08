const guard = new FinalizationRegistry((type: string) => {
  console.log(`${type} object reclaimed with ref over 0`)
})

// ts 5.2 provides Disposable, but stack is not available yet.
export class __Disposable {
  __ref: number = 1
  __defer: (() => Promise<void>)[] = []
  __deferObject: __Disposable[] = []

  constructor() {
    guard.register(this, this.constructor.name, this)
  }

  defer<T extends __Disposable | null | undefined>(target: T): T
  defer<T extends (() => Promise<void>) | null | undefined>(target: T): T
  defer(target?: __Disposable | (() => Promise<void>) | null | undefined) {
    if (!target) {
      return target
    } else if (target instanceof __Disposable) {
      target.ref()
      this.__deferObject.push(target)
    } else {
      this.__defer.push(target)
    }
    return target
  }

  takeDefered(pred: (target: __Disposable) => boolean, dispose?: true): Promise<void>
  takeDefered(pred: (target: __Disposable) => boolean, dispose: false): __Disposable[]
  takeDefered(
    pred: (target: __Disposable) => boolean,
    dispose = true
  ): __Disposable[] | Promise<void> {
    const result: __Disposable[] = []
    this.__deferObject = this.__deferObject.filter(target => {
      if (pred(target)) {
        result.push(target)
        return false
      } else {
        return true
      }
    })
    if (dispose) {
      return Promise.all(result.map(target => target.unref())).then(() => void 0)
    } else {
      return result
    }
  }

  ref(): this {
    this.__ref = this.__ref + 1
    return this
  }

  async unref() {
    if (this.__ref === 0) {
      throw 'unref object which __ref is 0'
    }
    this.__ref = this.__ref - 1
    if (this.__ref === 0) {
      await this.launchDispose()
      guard.unregister(this)
    }
  }

  async launchDispose() {
    await this.dispose()
    await Promise.all(this.__defer.map(x => x()))
    await Promise.all(this.__deferObject.map(x => x.unref()))
  }

  async dispose() {}
}

export async function awaitUsing<T>(func: (root: __Disposable) => Promise<T>): Promise<T> {
  const root = new __Disposable()
  try {
    return await func(root)
  } finally {
    await root.unref()
  }
}

// ts 5.2 provides Disposable, but stack is not available yet.
export interface __Disposable {
  dispose(): Promise<void>
}

export class __DisposableStack implements __Disposable {
  _list: __Disposable[]
  constructor() {
    this._list = []
  }

  add(dispose: __Disposable) {
    this._list.push(dispose)
  }

  async dispose() {
    const lst = this._list
    this._list = []
    await Promise.all(lst.map(x => x.dispose()))
  }
}

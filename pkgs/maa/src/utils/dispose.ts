// ts 5.2 provides Disposable, but stack is not available yet.
export interface __Disposable {
  dispose(): Promise<void>
}

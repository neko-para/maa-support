type ConvertRecordNever<T> = Record<string, never> extends T ? void : T

interface CallbackProvider<Request, Response> {
  dump: () => Promise<{
    ids: string[]
  }>
  free: (data: { id: string }) => Promise<unknown>
  new: () => Promise<{
    id: string
  }>
  query: (data: { id: string }) => Promise<{
    ids: string[]
  }>
  req: (data: { id: string; cid: string }) => Promise<Request>
  res: (data: { id: string; cid: string; ret: Response }) => Promise<unknown>
}

export function wrapCallback<Id extends string, Req, Res>(
  provider: CallbackProvider<Req, Res>,
  _: Id
) {
  return {
    async dump() {
      return (await provider.dump()).ids
    },
    async add() {
      const id = (await provider.new()).id as Id
      return id === '' ? null : id
    },
    async del(id: Id) {
      await provider.free({ id })
    },
    async pull(id: Id) {
      return (await provider.query({ id })).ids
    },
    async request(id: Id, cid: string): Promise<Req> {
      return await provider.req({ id, cid })
    },
    async response(id: Id, cid: string, ret: ConvertRecordNever<Res>) {
      await provider.res({ id, cid, ret: (ret ?? {}) as Res })
    },

    async setup(
      func: (req: Awaited<Req>) => Promise<ConvertRecordNever<Res>>
    ): Promise<[Id | null, () => Promise<void>]> {
      const id = await this.add()
      if (!id) {
        return [null, async () => {}]
      }
      let run = true
      const puller = async () => {
        try {
          const ids = await this.pull(id)
          if (!run) {
            return
          }

          await Promise.all(
            ids.map(async (cid: string) => {
              const req = await this.request(id, cid)
              const res = await func(req)
              await this.response(id, cid, res)
            })
          )

          if (!run) {
            return
          }

          setTimeout(puller, 0)
        } catch (_) {}
      }
      setTimeout(puller, 0)
      return [
        id,
        async () => {
          run = false
        }
      ]
    }
  }
}

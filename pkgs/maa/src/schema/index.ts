import type { IApi } from './schema-api/interface-api'
import { requestApi } from './schema-api/request-api'

export class ApiServerError {}

type NotUndefined<T> = T extends undefined ? never : T
type FilterPrefix<K extends string, P extends string> = K extends `${P}${infer name}` ? name : never
type GetPrefix<K extends string> = K extends `${infer name}/${infer _}` ? name : never

type CallbackSub = 'new' | 'free' | 'query' | 'req' | 'res' | 'dump'
type HandleSub = 'dump'

type ApiRoutes = FilterPrefix<keyof IApi, '/api/'>
type CallbackRoutes = GetPrefix<FilterPrefix<keyof IApi, '/callback/'>>
type HandleRoutes = GetPrefix<FilterPrefix<keyof IApi, '/handle/'>>

type GetApi<K extends ApiRoutes> = `/api/${K}` extends keyof IApi
  ? IApi[`/api/${K}`]['post']
  : never
type GetCallback<
  K extends CallbackRoutes,
  S extends CallbackSub
> = `/callback/${K}/${S}` extends keyof IApi ? IApi[`/callback/${K}/${S}`]['post'] : never
type GetHandle<K extends HandleRoutes, S extends HandleSub> = `/handle/${K}/${S}` extends keyof IApi
  ? IApi[`/handle/${K}/${S}`]['post']
  : never

let baseURL = 'http://127.0.0.1:13126'

type MakeFunc<Req, Res> =
  Record<string, never> extends Req
    ? () => Promise<NotUndefined<Res>>
    : (data: NotUndefined<Req>) => Promise<NotUndefined<Res>>

function makeApiHelper(): {
  [route in ApiRoutes]: MakeFunc<GetApi<route>['Body'], GetApi<route>['Response']['data']>
} {
  return new Proxy(
    {},
    {
      get(_, key: string) {
        return async (data: any) => {
          const res = await (requestApi as any)[`/api/${key}`]['post']({
            baseURL,
            data: data ?? {}
          })
          if (!res.success) {
            throw new ApiServerError()
          } else {
            return res.data
          }
        }
      }
    }
  ) as any
}

function makeCallbackHelper(): {
  [route in CallbackRoutes]: {
    [sub in CallbackSub]: MakeFunc<
      GetCallback<route, sub>['Body'],
      GetCallback<route, sub>['Response']['data']
    >
  }
} {
  return new Proxy(
    {},
    {
      get(_, key: string) {
        return new Proxy(
          {},
          {
            get(__, key2: string) {
              return async (data: any) => {
                const res = await (requestApi as any)[`/callback/${key}/${key2}`]['post']({
                  baseURL,
                  data: data ?? {}
                })
                if (!res.success) {
                  throw new ApiServerError()
                } else {
                  return res.data
                }
              }
            }
          }
        )
      }
    }
  ) as any
}

function makeHandleHelper(): {
  [route in HandleRoutes]: {
    [sub in HandleSub]: MakeFunc<
      GetHandle<route, sub>['Body'],
      GetHandle<route, sub>['Response']['data']
    >
  }
} {
  return new Proxy(
    {},
    {
      get(_, key: string) {
        return new Proxy(
          {},
          {
            get(__, key2: string) {
              return async (data: any) => {
                const res = await (requestApi as any)[`/handle/${key}/${key2}`]['post']({
                  baseURL,
                  data: data ?? {}
                })
                if (!res.success) {
                  throw new ApiServerError()
                } else {
                  return res.data
                }
              }
            }
          }
        )
      }
    }
  ) as any
}

export function setBaseURL(url: string) {
  baseURL = url
}

export function getBaseURL() {
  return baseURL
}

export const api = makeApiHelper()
export const callback = makeCallbackHelper()
export const handle = makeHandleHelper()

import type { IApi } from './schema-api/interface-api'
import { requestApi } from './schema-api/request-api'

export class ApiServerError {
  error: string

  constructor(err: string) {
    this.error = err
  }
}

type NotUndefined<T> = T extends undefined ? never : T
type FilterPrefix<K extends string, P extends string> = K extends `${P}${infer name}` ? name : never
type GetPrefix<K extends string> = K extends `${infer name}/${infer _}` ? name : never

type CallbackSub = 'add' | 'del' | 'dump' | 'pull' | 'request' | 'response'

type ApiRoutes = FilterPrefix<keyof IApi, '/api/'>
type CallbackRoutes = GetPrefix<FilterPrefix<keyof IApi, '/callback/'>>
type OpaqueRoutes = FilterPrefix<keyof IApi, '/opaque/'>

type GetApi<K extends ApiRoutes> = `/api/${K}` extends keyof IApi ? IApi[`/api/${K}`] : never
type GetCallback<
  K extends CallbackRoutes,
  S extends CallbackSub
> = `/callback/${K}/${S}` extends keyof IApi ? IApi[`/callback/${K}/${S}`] : never
type GetOpaque<K extends OpaqueRoutes> = `/opaque/${K}` extends keyof IApi
  ? IApi[`/opaque/${K}`]
  : never

let baseURL = 'http://127.0.0.1:13126'

function makeApiHelper(): {
  [route in ApiRoutes]: unknown extends GetApi<route>['Body']
    ? () => Promise<NotUndefined<GetApi<route>['Response']['data']>>
    : (
        data: NotUndefined<GetApi<route>['Body']>
      ) => Promise<NotUndefined<GetApi<route>['Response']['data']>>
} {
  return new Proxy(
    {},
    {
      get(_, key: string) {
        return async (data: any) => {
          const res = await (requestApi as any)[`/api/${key}`]({
            baseURL,
            data
          })
          if ('error' in res) {
            throw new ApiServerError(res.error)
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
    [sub in CallbackSub]: unknown extends GetCallback<route, sub>['Body']
      ? () => Promise<NotUndefined<GetCallback<route, sub>['Response']['data']>>
      : (
          data: NotUndefined<GetCallback<route, sub>['Body']>
        ) => Promise<NotUndefined<GetCallback<route, sub>['Response']['data']>>
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
                const res = await (requestApi as any)[`/callback/${key}/${key2}`]({
                  baseURL,
                  data
                })
                if ('error' in res) {
                  throw new ApiServerError(res.error)
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

function makeOpaqueHelper(): {
  [route in OpaqueRoutes]: unknown extends GetOpaque<route>['Body']
    ? () => Promise<NotUndefined<GetOpaque<route>['Response']['data']>>
    : (
        data: NotUndefined<GetOpaque<route>['Body']>
      ) => Promise<NotUndefined<GetOpaque<route>['Response']['data']>>
} {
  return new Proxy(
    {},
    {
      get(_, key: string) {
        return async (data: any) => {
          const res = await (requestApi as any)[`/opaque/${key}`]({
            baseURL,
            data
          })
          if ('error' in res) {
            throw new ApiServerError(res.error)
          } else {
            return res.data
          }
        }
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
export const opaque = makeOpaqueHelper()

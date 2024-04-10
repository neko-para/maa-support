import { NInput, NInputNumber } from 'naive-ui'

import type { Rect } from '@/types'

type FixArray<T, L extends number, V extends T[] = []> = V['length'] extends L
  ? V
  : FixArray<T, L, [...V, T]>

function makeNumberSeqEdit<L extends number>(count: L, prefix: FixArray<string, L>) {
  type List = FixArray<number, L>
  return (value: List, update: (v: List) => void, index: number) => {
    return (
      <div class={'flex gap-2'}>
        {Array.from({ length: count }).map((_, i) => {
          return (
            <NInputNumber
              key={i}
              showButton={false}
              placeholder={''}
              // @ts-ignore
              value={value[i]}
              onUpdateValue={v => {
                // @ts-ignore
                const res: List = [...value]
                // @ts-ignore
                res[i] = v ?? 0
                update(res)
              }}
              v-slots={{
                // @ts-ignore
                prefix: () => <span>{`${prefix[i]}:`}</span>
              }}
            ></NInputNumber>
          )
        })}
      </div>
    )
  }
}

export const MRectEdit = makeNumberSeqEdit(4, ['x', 'y', 'w', 'h'])
export const MRGBEdit = makeNumberSeqEdit(3, ['r', 'g', 'b'])
export const MHSVEdit = makeNumberSeqEdit(3, ['h', 's', 'v'])
export const MGrayEdit = makeNumberSeqEdit(1, ['g'])

export function MStringEdit(value: string, update: (v: string) => void, index: number) {
  return <NInput value={value} onUpdateValue={update} placeholder={''}></NInput>
}

export function MThresholdEdit(value: number, update: (v: number) => void, index: number) {
  return (
    <NInputNumber
      showButton={false}
      placeholder={''}
      value={value}
      onUpdateValue={v => update(v ?? 0)}
      min={0}
      max={1}
    ></NInputNumber>
  )
}

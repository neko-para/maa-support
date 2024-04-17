import { NInput, NInputNumber } from 'naive-ui'

import type { Rect } from '@/types'

import MImageChoice from './MImageChoice.vue'
import MNumberSeq from './MNumberSeq.vue'
import MStringSeq from './MStringSeq.vue'
import MTaskChoice from './MTaskChoice.vue'

type FixArray<T, L extends number, V extends T[] = []> = V['length'] extends L
  ? V
  : FixArray<T, L, [...V, T]>

function makeNumberSeqEdit<L extends number>(count: L, prefix: FixArray<string, L>) {
  type List = FixArray<number, L>
  return (value: List, update: (v: List) => void, index: number) => {
    return (
      <MNumberSeq
        len={count}
        prefix={prefix}
        value={value}
        onUpdate:value={v => update(v as List)}
      ></MNumberSeq>
    )
  }
}

function makeStringSeqEdit<L extends number>(count: L, prefix: FixArray<string, L>) {
  type List = FixArray<string, L>
  return (value: List, update: (v: List) => void, index: number) => {
    return (
      <MStringSeq
        len={count}
        prefix={prefix}
        value={value}
        onUpdate:value={v => update(v as List)}
      ></MStringSeq>
    )
  }
}

export const MRectEdit = makeNumberSeqEdit(4, ['X', 'Y', 'Width', 'Height'])
export const MRGBEdit = makeNumberSeqEdit(3, ['R', 'G', 'B'])
export const MHSVEdit = makeNumberSeqEdit(3, ['H', 'S', 'V'])
export const MGrayEdit = makeNumberSeqEdit(1, ['Gray'])

export const MReplaceEdit = makeStringSeqEdit(2, ['From', 'To'])

export function MStringEdit(value: string, update: (v: string) => void, index: number) {
  return <NInput value={value} onUpdateValue={update} placeholder={''}></NInput>
}

export function MCharEdit(value: number, update: (v: number) => void, index: number) {
  return (
    <NInputNumber
      value={value}
      onUpdateValue={v => update(v ?? 0)}
      placeholder={''}
      showButton={false}
      min={0}
      max={127}
      v-slots={{
        suffix: () => <span> {JSON.stringify(String.fromCharCode(value)).slice(1, -1)} </span>
      }}
    ></NInputNumber>
  )
}

export function MNextEdit(value: string, update: (v: string) => void, index: number) {
  return <MTaskChoice value={value} onUpdate:value={update}></MTaskChoice>
}

export function MTemplateEdit(value: string, update: (v: string) => void, index: number) {
  return <MImageChoice value={value} onUpdate:value={update}></MImageChoice>
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

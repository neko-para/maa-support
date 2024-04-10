<script setup lang="tsx" generic="T">
import { NButton } from 'naive-ui'
import { type WritableComputedRef, computed } from 'vue'

import MIcon from '../MIcon.vue'

const props = defineProps<{
  value: T | T[] | null
  test: (v: T | T[]) => boolean
  def: () => T
  render: (value: T, update: (v: T) => void, index: number) => JSX.Element
}>()

const emits = defineEmits<{
  'update:value': [T[] | null]
}>()

const array_view = computed(() => {
  return props.value === null
    ? []
    : props.test(props.value)
      ? (props.value as T[])
      : [props.value as T]
})

const add = (value: T) => {
  emits('update:value', [...array_view.value, value])
}

const update_at = (index: number, value: T) => {
  const res = [...array_view.value]
  res[index] = value
  emits('update:value', res)
}

const remove_at = (index: number) => {
  const res = [...array_view.value]
  res.splice(index, 1)
  emits('update:value', res)
}

const render_list = computed(() => {
  const edit = props.render(props.def(), add, array_view.value.length)
  const list =
    props.value === null
      ? [edit]
      : array_view.value
          .map((value, index) => {
            return props.render(
              value,
              v => {
                update_at(index, v)
              },
              index
            )
          })
          .concat(edit)
  return (
    <div class={'flex flex-col gap-2'}>
      {list.map((sub, index) => {
        return (
          <div class={'flex items-center gap-2'} key={index}>
            <NButton
              onClick={() => {
                if (index === list.length - 1) {
                  add(props.def())
                } else {
                  remove_at(index)
                }
              }}
              renderIcon={() => {
                return <MIcon wght={200}> {index === list.length - 1 ? 'add' : 'close'} </MIcon>
              }}
            ></NButton>
            {sub}
          </div>
        )
      })}
    </div>
  )
})
</script>

<template>
  <render_list></render_list>
</template>

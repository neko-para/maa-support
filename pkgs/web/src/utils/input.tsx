import { NButton, NInput, useDialog } from 'naive-ui'
import type { DialogApiInjection } from 'naive-ui/es/dialog/src/DialogProvider'
import { ref } from 'vue'

function flatPromise<T>() {
  let res: (v: T) => void
  const pro = new Promise<T>(resolve => {
    res = resolve
  })
  return [res!, pro] as const
}

export function requestInput(dialog: DialogApiInjection, title: string, content: string = '') {
  const [res, pro] = flatPromise<string | null>()
  const value = ref<string>('')
  const dlg = dialog.create({
    title,
    onClose: () => {
      res(null)
    },
    onMaskClick: () => {
      res(null)
    },
    content: () => {
      return (
        <div class={'flex flex-col gap-2'}>
          <span> {content} </span>
          <NInput
            value={value.value}
            onUpdateValue={v => {
              value.value = v
            }}
            placeholder={''}
          ></NInput>
        </div>
      )
    },
    action: () => {
      return (
        <NButton
          onClick={() => {
            res(value.value)
            dlg.destroy()
          }}
        >
          ok
        </NButton>
      )
    }
  })
  return pro
}

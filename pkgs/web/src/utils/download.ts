export function triggerDownload(dataUrl: string, name: string) {
  const el = document.createElement('a')
  el.href = dataUrl
  el.download = name
  el.setAttribute('style', 'display:none')
  document.body.appendChild(el)
  el.click()
  document.body.removeChild(el)
  URL.revokeObjectURL(dataUrl)
}

let prevResolve: ((v: null) => void) | null = null

export async function triggerUpload(selector: string) {
  if (prevResolve) {
    const resolve = prevResolve
    prevResolve = null
    resolve(null)
  }
  const el = document.createElement('input')
  el.setAttribute('style', 'display:none')
  el.setAttribute('type', 'file')
  el.setAttribute('accept', selector)
  document.body.appendChild(el)
  const pro = new Promise<File | null>(resolve => {
    prevResolve = resolve
    el.addEventListener('change', event => {
      prevResolve = null
      const file = el.files?.[0]
      if (file) {
        resolve(file)
      } else {
        resolve(null)
      }
    })
    el.addEventListener('cancel', event => {
      prevResolve = null
      resolve(null)
    })
  })
  el.click()
  const file = await pro
  document.body.removeChild(el)
  return file
}

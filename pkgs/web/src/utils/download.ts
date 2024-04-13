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

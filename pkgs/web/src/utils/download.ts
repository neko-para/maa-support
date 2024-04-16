import { fileOpen, fileSave } from 'browser-fs-access'

export function triggerDownload(data: Blob, name: string) {
  return fileSave(data, {
    fileName: name
  })
}

export async function triggerUpload(opts: { mimeTypes?: string[]; extensions?: string[] }) {
  try {
    const result = await fileOpen({
      ...opts,
      legacySetup: rejectionHandler => {
        const timeoutId = setTimeout(rejectionHandler, 10_000)
        return reject => {
          clearTimeout(timeoutId)
          if (reject) {
            reject('My error message here.')
          }
        }
      }
    })
    return result as File
  } catch (_) {
    return null
  }
}

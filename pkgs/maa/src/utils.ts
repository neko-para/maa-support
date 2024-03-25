import { AdbType } from './types'

export type AdbTypeTouch = 'adb' | 'mini touch' | 'maa touch' | 'auto detect'
export type AdbTypeKey = 'adb' | 'maa touch' | 'auto detect'
export type AdbTypeScreencap =
  | 'raw by netcat'
  | 'raw with gzip'
  | 'encode'
  | 'encode to file'
  | 'minicap direct'
  | 'minicap stream'
  | 'fastest lossless way'
  | 'fastest way'

export function toAdbType(
  touch: AdbTypeTouch,
  key: AdbTypeKey,
  screencap: AdbTypeScreencap
): AdbType {
  let type: AdbType = 0

  switch (touch) {
    case 'adb':
      type |= AdbType.Touch_Adb
      break
    case 'mini touch':
      type |= AdbType.Touch_MiniTouch
      break
    case 'maa touch':
      type |= AdbType.Touch_MaaTouch
      break
    case 'auto detect':
      type |= AdbType.Touch_AutoDetect
      break
  }

  switch (key) {
    case 'adb':
      type |= AdbType.Key_Adb
      break
    case 'maa touch':
      type |= AdbType.Key_MaaTouch
      break
    case 'auto detect':
      type |= AdbType.Key_AutoDetect
      break
  }

  switch (screencap) {
    case 'raw by netcat':
      type |= AdbType.Screencap_RawByNetcat
      break
    case 'raw with gzip':
      type |= AdbType.Screencap_RawWithGzip
      break
    case 'encode':
      type |= AdbType.Screencap_Encode
      break
    case 'encode to file':
      type |= AdbType.Screencap_EncodeToFile
      break
    case 'minicap direct':
      type |= AdbType.Screencap_MinicapDirect
      break
    case 'minicap stream':
      type |= AdbType.Screencap_MinicapStream
      break
    case 'fastest lossless way':
      type |= AdbType.Screencap_FastestLosslessWay
      break
    case 'fastest way':
      type |= AdbType.Screencap_FastestWay
      break
  }

  return type
}

export function fromAdbType(type: AdbType) {
  const ret = {} as {
    touch?: AdbTypeTouch
    key?: AdbTypeKey
    screencap?: AdbTypeScreencap
  }

  switch (type & AdbType.Touch_Mask) {
    case AdbType.Touch_Adb:
      ret.touch = 'adb'
      break
    case AdbType.Touch_MiniTouch:
      ret.touch = 'mini touch'
      break
    case AdbType.Touch_MaaTouch:
      ret.touch = 'maa touch'
      break
    case AdbType.Touch_AutoDetect:
      ret.touch = 'auto detect'
      break
  }

  switch (type & AdbType.Key_Mask) {
    case AdbType.Key_Adb:
      ret.key = 'adb'
      break
    case AdbType.Key_MaaTouch:
      ret.key = 'maa touch'
      break
    case AdbType.Key_AutoDetect:
      ret.key = 'auto detect'
      break
  }

  switch (type & AdbType.Screencap_Mask) {
    case AdbType.Screencap_RawByNetcat:
      ret.screencap = 'raw by netcat'
      break
    case AdbType.Screencap_RawWithGzip:
      ret.screencap = 'raw with gzip'
      break
    case AdbType.Screencap_Encode:
      ret.screencap = 'encode'
      break
    case AdbType.Screencap_EncodeToFile:
      ret.screencap = 'encode to file'
      break
    case AdbType.Screencap_MinicapDirect:
      ret.screencap = 'minicap direct'
      break
    case AdbType.Screencap_MinicapStream:
      ret.screencap = 'minicap stream'
      break
    case AdbType.Screencap_FastestLosslessWay:
      ret.screencap = 'fastest lossless way'
      break
    case AdbType.Screencap_FastestWayDeprecated:
    case AdbType.Screencap_FastestWay:
      ret.screencap = 'fastest way'
      break
  }

  return ret
}

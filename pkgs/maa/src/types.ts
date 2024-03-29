export const enum Status {
  Invalid = 0,
  Pending = 1000,
  Running = 2000,
  Success = 3000,
  Failed = 4000
}

export const enum GlobalOption {
  Invalid = 0,
  LogDir = 1,
  SaveDraw = 2,
  Recording = 3,
  StdoutLevel = 4,
  ShowHitDraw = 5,
  DebugMessage = 6
}

export const enum ControllerOption {
  Invalid = 0,
  ScreenshotTargetLongSide = 1,
  ScreenshotTargetShortSide = 2,
  DefaultAppPackageEntry = 3,
  DefaultAppPackage = 4,
  Recording = 5
}

export const enum AdbType {
  Invalid = 0,

  Touch_Adb = 1,
  Touch_MiniTouch = 2,
  Touch_MaaTouch = 3,
  Touch_Mask = 0xff,
  Touch_AutoDetect = Touch_Mask - 1,

  Key_Adb = 1 << 8,
  Key_MaaTouch = 2 << 8,
  Key_Mask = 0xff00,
  Key_AutoDetect = Key_Mask - (1 << 8),

  Input_Preset_Adb = Touch_Adb | Key_Adb,
  Input_Preset_Minitouch = Touch_MiniTouch | Key_Adb,
  Input_Preset_Maatouch = Touch_MaaTouch | Key_MaaTouch,
  Input_Preset_AutoDetect = Touch_AutoDetect | Key_AutoDetect,

  Screencap_FastestWayDeprecated = 1 << 16,
  Screencap_RawByNetcat = 2 << 16,
  Screencap_RawWithGzip = 3 << 16,
  Screencap_Encode = 4 << 16,
  Screencap_EncodeToFile = 5 << 16,
  Screencap_MinicapDirect = 6 << 16,
  Screencap_MinicapStream = 7 << 16,
  Screencap_Mask = 0xff0000,
  Screencap_FastestLosslessWay = Screencap_Mask - (2 << 16),
  Screencap_FastestWay = Screencap_Mask - (1 << 16)
}

export type MaaRect = {
  x: number
  y: number
  width: number
  height: number
}

export interface AdbConfig {
  adb_path: string
  address: string
  type: AdbType
  config: string
}

export interface DeviceInfo extends AdbConfig {
  name: string
}

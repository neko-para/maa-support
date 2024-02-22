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

  // value: bool, eg: true; val_size: sizeof(bool)
  SaveDraw = 2,

  // Dump all screenshots and actions
  // this option will || with MaaCtrlOption_Recording
  // value: bool, eg: true; val_size: sizeof(bool)
  Recording = 3,

  // value: MaaLoggingLevel, val_size: sizeof(MaaLoggingLevel), default by MaaLoggingLevel_Error
  StdoutLevel = 4,

  // value: bool, eg: true; val_size: sizeof(bool)
  ShowHitDraw = 5
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

  Key_Adb = 1 << 8,
  Key_MaaTouch = 2 << 8,
  Key_Mask = 0xff00,

  Input_Preset_Adb = Touch_Adb | Key_Adb,
  Input_Preset_Minitouch = Touch_MiniTouch | Key_Adb,
  Input_Preset_Maatouch = Touch_MaaTouch | Key_MaaTouch,

  Screencap_FastestWay = 1 << 16,
  Screencap_RawByNetcat = 2 << 16,
  Screencap_RawWithGzip = 3 << 16,
  Screencap_Encode = 4 << 16,
  Screencap_EncodeToFile = 5 << 16,
  Screencap_MinicapDirect = 6 << 16,
  Screencap_MinicapStream = 7 << 16,
  Screencap_Mask = 0xff0000
}

export type MaaRect = {
  x: number
  y: number
  width: number
  height: number
}
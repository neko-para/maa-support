import '@maa/maa'
import {
  $callback,
  $controller,
  $customActionRun,
  $customActionStop,
  $device,
  $global,
  $instance,
  $resource,
  APICallbackId,
  AdbType,
  ControllerId,
  ControllerOption,
  CustomActionRunId,
  CustomActionStopId,
  GlobalOption,
  InstanceId,
  ResourceId
} from '@maa/maa'
import { EventEmitter } from 'events'
import { existsSync, statSync } from 'fs'
import fs from 'fs/promises'
import { visit } from 'jsonc-parser'
import path from 'path'

import { ILaunchRequestArguments } from './session'
import { PipelineEntry, PipelineFile } from './types'

export interface IRuntimeBreakPoint {
  id: number
  row: number
  verified: boolean
}

export class MaaFrameworkDebugRuntime extends EventEmitter {
  resource?: string
  taskIndex: Record<
    string,
    {
      file: string
      row: number
      col: number
      data: PipelineEntry
      bp?: IRuntimeBreakPoint
    }
  > = {}

  breakPoints: Record<string, IRuntimeBreakPoint[]> = {}
  breakPointId: number = 1

  breakPointIndex: Record<number, string> = {}

  expectStop: boolean = false
  stopRunning?: (done: () => void) => void = () => {}
  pauseContext?: {
    task: string
    conti: () => void
  }
  pauseNext = false

  constructor() {
    super()
  }

  async loadResource(res: string) {
    if (this.resource === res) {
      return true
    }

    // 这里置空确保在加载过程中不会错误verify断点
    this.resource = undefined
    this.taskIndex = {}

    let pipelineDir = path.join(res, 'pipeline')
    // 弱智windows上面uri的盘符时小写的
    if (process.platform === 'win32') {
      pipelineDir = pipelineDir.slice(0, 1).toLowerCase() + pipelineDir.slice(1)
    }
    if (!existsSync(pipelineDir)) {
      return false
    }
    for (const file of await fs.readdir(pipelineDir, { recursive: true })) {
      const fullPath = path.join(pipelineDir, file)
      if (file.endsWith('.json') && statSync(fullPath).isFile()) {
        const content = await fs.readFile(fullPath, 'utf-8')
        let data: PipelineFile
        try {
          data = JSON.parse(content)
        } catch (_) {
          continue
        }
        visit(content, {
          onObjectProperty: (property, offset, length, startLine, startCharacter, pathSupplier) => {
            if (pathSupplier().length !== 0) {
              return
            }
            if (property.startsWith('$')) {
              return
            }
            if (!(property in data)) {
              return
            }
            this.taskIndex[property] = {
              file: fullPath,
              row: startLine,
              col: startCharacter,
              data: data[property]
            }
          }
        })
      }
    }

    this.resource = res

    return true
  }

  async start(arg: ILaunchRequestArguments) {
    if (!(await this.loadResource(arg.resource))) {
      this.sendEvent('output', `加载资源失败`)
      return false
    }

    await this.verifyBreakPoints()

    let afterStop: () => void = () => {}
    this.expectStop = false
    this.stopRunning = done => {
      afterStop = done
      this.expectStop = true
    }

    let ver: string

    try {
      ver = await $global.version()
    } catch (_) {
      this.sendEvent('output', `连接MaaHttp失败`)
      afterStop()
      return false
    }

    this.sendEvent('output', `Maa版本: ${ver}`)

    if (arg.log) {
      if (await $global.setOptionS(GlobalOption.LogDir, arg.log)) {
        this.sendEvent('output', `日志目录: ${arg.log}`)
      }
    }

    await $global.setOptionB(GlobalOption.DebugMessage, true)

    if (this.expectStop) {
      afterStop()
      return false
    }

    await $device.post()
    const count = await $device.wait()
    if (count === 0) {
      this.sendEvent('output', `未找到设备`)
      return false
    }

    const info = await $device.get(0)

    info.type = (info.type & ~AdbType.Screencap_Mask) | AdbType.Screencap_Encode

    if (this.expectStop) {
      afterStop()
      return false
    }

    const callbackId: APICallbackId = (await $callback.add())!

    const proc = async () => {
      try {
        const ids = await $callback.pull(callbackId)
        setTimeout(async () => {
          try {
            for (const cid of ids) {
              await $callback.process(callbackId, cid, async (msg, detail) => {
                this.sendEvent('output', `${msg} ${detail}`)

                console.log(msg, detail)

                const debugDetail = JSON.parse(detail) as {
                  id: number
                  entry: string
                  uuid: string
                  hash: string
                  name: string
                  latest_hit: string
                  recognition: object
                  run_times: number
                  status: string
                }
                switch (msg) {
                  case 'Task.Debug.ReadyToRun':
                    if (this.taskIndex[debugDetail.name].bp) {
                      // 目前不存在next和stepIn的区别，因此不会在next的时候提前触发breakpoint
                      this.pauseNext = false

                      let resolve: () => void = () => {}
                      const pro = new Promise<void>(res => {
                        resolve = res
                      })
                      this.pauseContext = {
                        task: debugDetail.name,
                        conti: resolve
                      }
                      this.sendEvent('stopOnBreakpoint', this.taskIndex[debugDetail.name].bp!.id)
                      await pro
                    } else if (this.pauseNext) {
                      this.pauseNext = false

                      let resolve: () => void = () => {}
                      const pro = new Promise<void>(res => {
                        resolve = res
                      })
                      this.pauseContext = {
                        task: debugDetail.name,
                        conti: resolve
                      }
                      this.sendEvent('stopOnStep')
                      await pro
                    }
                  // case 'Task.Debug.Runout':
                  // case 'Task.Debug.Completed':
                }
              })
            }
            setTimeout(proc, 0)
          } catch (_) {}
        }, 1000)
      } catch (_) {}
    }
    setTimeout(proc, 0)

    const actionRunId: CustomActionRunId = (await $customActionRun.add())!
    const runProc = async () => {
      try {
        const ids = await $customActionRun.pull(actionRunId)
        setTimeout(async () => {
          try {
            for (const cid of ids) {
              await $customActionRun.process(
                actionRunId,
                cid,
                async (sync_ctx, task, param, box, detail) => {
                  this.sendEvent('output', `${sync_ctx} ${task} ${param} ${box} ${detail}`)
                  console.log(sync_ctx, task, param, box, detail)
                  return true
                }
              )
            }
            setTimeout(runProc, 0)
          } catch (_) {}
        }, 1000)
      } catch (_) {}
    }
    setTimeout(runProc, 0)

    const actionStopId: CustomActionStopId = (await $customActionStop.add())!
    const stopProc = async () => {
      try {
        const ids = await $customActionStop.pull(actionStopId)
        setTimeout(async () => {
          try {
            for (const cid of ids) {
              await $customActionStop.process(actionStopId, cid, async () => {
                this.sendEvent('output', `action stop`)
                console.log('action stop')
              })
            }
            setTimeout(stopProc, 0)
          } catch (_) {}
        }, 1000)
      } catch (_) {}
    }
    setTimeout(stopProc, 0)

    const controllerId: ControllerId = (await $controller.createAdb(info, arg.agent, callbackId))!
    const resourceId: ResourceId = (await $resource.create(callbackId))!
    const instanceId: InstanceId = (await $instance.create(callbackId))!
    await $instance.bindCtrl(instanceId, controllerId)
    await $instance.bindRes(instanceId, resourceId)

    await $instance.registerCustomAction(instanceId, 'TestAct', actionRunId, actionStopId)

    if (arg.controller) {
      if (arg.controller.long) {
        await $controller.setOptionI(
          controllerId,
          ControllerOption.ScreenshotTargetLongSide,
          arg.controller.long
        )
      } else if (arg.controller.short) {
        await $controller.setOptionI(
          controllerId,
          ControllerOption.ScreenshotTargetShortSide,
          arg.controller.short
        )
      }
      if (arg.controller.packageEntry) {
        await $controller.setOptionS(
          controllerId,
          ControllerOption.DefaultAppPackageEntry,
          arg.controller.packageEntry
        )
      }
      if (arg.controller.package) {
        await $controller.setOptionS(
          controllerId,
          ControllerOption.DefaultAppPackage,
          arg.controller.package
        )
      }
    }

    const clear = () => {
      $instance.destroy(instanceId)
      $resource.destroy(resourceId)
      $controller.destroy(controllerId)
      $callback.del(callbackId)
    }

    if (this.expectStop) {
      clear()
      afterStop()
      return false
    }

    await $controller.wait(controllerId, await $controller.postConnection(controllerId))
    await $resource.wait(resourceId, await $resource.postPath(resourceId, arg.resource))

    if (!(await $instance.inited(instanceId))) {
      this.sendEvent('output', `Maa实例初始化失败`)
      clear()
      afterStop()
      return false
    }

    this.stopRunning = done => {
      $instance.postStop(instanceId).then(() => {
        this.expectStop = true
        clear()
        done()
      })
    }

    $instance
      .wait(instanceId, await $instance.postTask(instanceId, arg.task, JSON.stringify(arg.param)))
      .then(() => {
        this.stopRunning = done => {
          this.expectStop = true
          done()
        }
        clear()

        this.sendEvent('end')
      })

    return !this.expectStop
  }

  async terminate() {
    if (!this.expectStop && this.stopRunning) {
      this.expectStop = true
      this.continue()
      return new Promise<void>(resolve => {
        this.stopRunning?.(resolve)
      })
    } else {
      return
    }
  }

  continue() {
    if (this.pauseContext) {
      setTimeout(this.pauseContext.conti, 0)
      delete this.pauseContext
    }
  }

  next() {
    if (this.pauseContext) {
      this.pauseNext = true

      setTimeout(this.pauseContext.conti, 0)
      delete this.pauseContext
    }
  }

  stack(start: number, end: number) {
    if (!this.pauseContext) {
      return null
    }
    const pauseTask = this.taskIndex[this.pauseContext.task]
    if (!pauseTask) {
      return {
        stack: [],
        count: 0
      }
    }
    const frames = [
      {
        index: 0,
        name: 'default frame',
        file: pauseTask.file,
        line: pauseTask.row,
        column: pauseTask.col
      }
    ]
    return {
      stack: frames.slice(start, end),
      count: frames.length
    }
  }

  async setBreakPoint(src: string, row: number): Promise<IRuntimeBreakPoint> {
    const bp: IRuntimeBreakPoint = {
      id: this.breakPointId++,
      row,
      verified: false
    }

    this.breakPoints[src] = [...(this.breakPoints[src] ?? []), bp]

    await this.verifyBreakPoints(src)

    return bp
  }

  removeBreakPointIndex(id: number) {
    delete this.taskIndex[this.breakPointIndex[id]].bp
    delete this.breakPointIndex[id]
  }

  clearBreakPoint(src: string, row: number): IRuntimeBreakPoint | null {
    const bps = this.breakPoints[src] ?? []
    const idx = bps.findIndex(bp => bp.row === row)
    if (idx === -1) {
      return null
    }
    const bp = bps[idx]
    bps.splice(idx, 1)
    this.removeBreakPointIndex(bp.id)
    return bp
  }

  clearBreakPoints(src: string) {
    if (src in this.breakPoints) {
      for (const bp of this.breakPoints[src]) {
        this.removeBreakPointIndex(bp.id)
      }
      delete this.breakPoints[src]
    }
  }

  async verifyBreakPoints(src?: string) {
    if (!this.resource) {
      return
    }
    if (!src) {
      const srcs = [...new Set(Object.values(this.taskIndex).map(info => info.file))]
      for (const _src of srcs) {
        await this.verifyBreakPoints(_src)
      }
      return
    }
    const bps = this.breakPoints[src] ?? []
    for (const bp of bps) {
      if (bp.verified) {
        continue
      }
      let result: number = -1
      let resultTask: string = ''
      for (const [task, info] of Object.entries(this.taskIndex)) {
        if (info.file !== src) {
          continue
        }
        if (info.row <= bp.row) {
          if (result < info.row) {
            result = info.row
            resultTask = task
          }
        }
      }
      if (result !== -1) {
        bp.row = result
        bp.verified = true

        this.breakPointIndex[bp.id] = resultTask
        this.taskIndex[resultTask].bp = bp
      } else {
        bp.verified = false
      }
      this.sendEvent('breakpointValidated', bp)
    }
  }

  sendEvent(event: string, ...args: unknown[]) {
    setTimeout(() => {
      this.emit(event, ...args)
    }, 0)
  }
}

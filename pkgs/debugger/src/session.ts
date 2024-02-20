import {
  Breakpoint,
  BreakpointEvent,
  InitializedEvent,
  Logger,
  LoggingDebugSession,
  OutputEvent,
  Source,
  StackFrame,
  StoppedEvent,
  TerminatedEvent,
  Thread,
  logger
} from '@vscode/debugadapter'
import { DebugProtocol } from '@vscode/debugprotocol'
import path from 'path'

import { IRuntimeBreakPoint, MaaFrameworkDebugRuntime } from './runtime'

export interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  resource: string
  agent: string
  task: string
  param?: Record<string, Record<string, unknown>>
  log?: string
  controller?: {
    long?: number
    short?: number
    packageEntry?: string
    package?: string
  }
}

interface IAttachRequestArguments extends ILaunchRequestArguments {}

export class MaaFrameworkDebugSession extends LoggingDebugSession {
  runtime: MaaFrameworkDebugRuntime

  constructor() {
    super()

    this.runtime = new MaaFrameworkDebugRuntime()

    this.setDebuggerLinesStartAt1(false)
    this.setDebuggerColumnsStartAt1(false)

    this.runtime.on('breakpointValidated', (bp: IRuntimeBreakPoint) => {
      this.sendEvent(
        new BreakpointEvent('changed', {
          verified: bp.verified,
          id: bp.id,
          line: this.convertDebuggerLineToClient(bp.row)
        } as DebugProtocol.Breakpoint)
      )
    })
    this.runtime.on('stopOnStep', () => {
      this.sendEvent(new StoppedEvent('step', 0))
    })
    this.runtime.on('stopOnBreakpoint', (id: number) => {
      this.sendEvent(new StoppedEvent('breakpoint', 0))
    })
    this.runtime.on('output', (str: string) => {
      const e: DebugProtocol.OutputEvent = new OutputEvent(str + '\n')
      this.sendEvent(e)
    })
    this.runtime.on('end', () => {
      this.sendEvent(new TerminatedEvent())
    })
  }

  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    args: DebugProtocol.InitializeRequestArguments
  ): void {
    response.body = response.body ?? {}

    this.sendResponse(response)

    this.sendEvent(new InitializedEvent())
  }

  protected attachRequest(
    response: DebugProtocol.AttachResponse,
    args: IAttachRequestArguments,
    request?: DebugProtocol.Request | undefined
  ) {
    return this.launchRequest(response, args, request)
  }

  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: ILaunchRequestArguments,
    request?: DebugProtocol.Request | undefined
  ) {
    logger.setup(Logger.LogLevel.Verbose, false)

    if (!(await this.runtime.start(args))) {
      this.sendErrorResponse(response, {
        id: 1001,
        format: `launch error: unknown error.`,
        showUser: true
      })
    } else {
      this.sendResponse(response)
    }
  }

  protected async disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    args: DebugProtocol.DisconnectArguments,
    request?: DebugProtocol.Request | undefined
  ) {
    await this.runtime.terminate()
    this.sendResponse(response)
  }

  protected async setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments
  ) {
    const path = args.source.path as string
    const clientLines = args.lines || []

    this.runtime.clearBreakPoints(path)

    const actualBreakpoints0 = clientLines.map(async l => {
      const { verified, row, id } = await this.runtime.setBreakPoint(
        path,
        this.convertClientLineToDebugger(l)
      )
      const bp = new Breakpoint(
        verified,
        this.convertDebuggerLineToClient(row)
      ) as DebugProtocol.Breakpoint
      bp.id = id
      return bp
    })
    const actualBreakpoints = await Promise.all<DebugProtocol.Breakpoint>(actualBreakpoints0)

    response.body = {
      breakpoints: actualBreakpoints
    }
    this.sendResponse(response)
  }

  protected continueRequest(
    response: DebugProtocol.ContinueResponse,
    args: DebugProtocol.ContinueArguments,
    request?: DebugProtocol.Request | undefined
  ): void {
    this.runtime.continue()
    this.sendResponse(response)
  }

  protected nextRequest(
    response: DebugProtocol.NextResponse,
    args: DebugProtocol.NextArguments,
    request?: DebugProtocol.Request | undefined
  ): void {
    this.runtime.next()
    this.sendResponse(response)
  }

  protected stepInRequest(
    response: DebugProtocol.StepInResponse,
    args: DebugProtocol.StepInArguments,
    request?: DebugProtocol.Request | undefined
  ): void {
    this.nextRequest(response, args, request)
  }

  protected stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    args: DebugProtocol.StepOutArguments,
    request?: DebugProtocol.Request | undefined
  ): void {
    this.nextRequest(response, args, request)
  }

  protected threadsRequest(
    response: DebugProtocol.ThreadsResponse,
    request?: DebugProtocol.Request | undefined
  ): void {
    response.body = {
      threads: [new Thread(0, 'main thread')]
    }
    this.sendResponse(response)
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments,
    request?: DebugProtocol.Request | undefined
  ): void {
    const startFrame = args.startFrame ?? 0
    const maxLevels = args.levels ?? 10
    const endFrame = startFrame + maxLevels

    const stackInfo = this.runtime.stack(startFrame, endFrame)

    if (stackInfo) {
      const { stack, count } = stackInfo
      response.body = {
        stackFrames: stack.map(f => {
          const sf = new StackFrame(
            f.index,
            f.name,
            new Source(path.basename(f.file), this.convertDebuggerPathToClient(f.file)),
            this.convertDebuggerLineToClient(f.line),
            this.convertDebuggerColumnToClient(f.column)
          )
          return sf
        }),
        totalFrames: count
      }
    } else {
      response.body = {
        stackFrames: [],
        totalFrames: 0
      }
    }
    this.sendResponse(response)
  }
}

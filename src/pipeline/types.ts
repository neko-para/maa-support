import type { JSONPath } from 'jsonc-parser'
import * as vscode from 'vscode'

export interface PipelineTaskInfo {
  locations: vscode.LocationLink[]
  references: vscode.Location[]
}

export type PipelineTaskIndex = {
  [task: string]: PipelineTaskInfo
}

export type PipelineTaskCompletionData = {
  type: 'task'
  info: PipelineTaskInfo
}

export interface PipelineSpec {
  name: string

  isTaskPath: (path: JSONPath) => boolean
  isImagePath: (path: JSONPath) => boolean
  isEntryPath: (path: JSONPath) => boolean

  getRoot: (doc: vscode.TextDocument) => string | null
  fallbackRoot: (root: string) => string | null

  getPipelineRoot: (root: string) => string | null
  enumPipeline: (root: string) => Promise<string[]>

  getImageRoot: (root: string) => string | null

  getTaskImage?: (task: string) => string

  buildTaskIndex: (doc: vscode.TextDocument) => Promise<PipelineTaskIndex | null>

  getTaskFallback: (task: string) => {
    task: string
    prefix: number
    suffix: number
  }[]

  extraTaskCompletion?: (
    index: PipelineTaskIndex,
    suffix: string,
    current: string
  ) => Promise<{
    kind: vscode.CompletionItemKind
    overrite: boolean
    items: {
      text: string
      data?: PipelineTaskCompletionData
    }[]
  } | null>
}

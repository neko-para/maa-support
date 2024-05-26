import * as vscode from 'vscode'

import { FindTokenInfo, locateToken } from '../utils/json'
import { PipelineSpec } from './types'

export function locatePipelineToken(
  document: vscode.TextDocument,
  position: vscode.Position,
  spec: PipelineSpec
): {
  type: 'task' | 'image' | 'entry' | 'roi'
  value: string
  range: vscode.Range
} | null {
  try {
    locateToken(document, position)
    return null
  } catch (result: unknown) {
    if (!(result instanceof FindTokenInfo)) {
      return null
    }
    if (result.info.type === 'string') {
      if (spec.isTaskPath(result.path)) {
        return {
          type: 'task',
          value: result.info.value,
          range: result.range
        }
      } else if (spec.isImagePath(result.path)) {
        return {
          type: 'image',
          value: result.info.value,
          range: result.range
        }
      } else {
        return null
      }
    } else if (result.info.type === 'property') {
      if (spec.isEntryPath(result.path)) {
        return {
          type: 'entry',
          value: result.info.value,
          range: result.range
        }
      } else {
        return null
      }
    } else if (result.info.type === 'roi') {
      return {
        type: 'roi',
        value: '',
        range: result.range
      }
    } else {
      return null
    }
  }
}

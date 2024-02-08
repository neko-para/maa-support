import { existsSync } from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

import type { PipelineSpec } from './types'
import { locatePipelineToken } from './utils'

export class GeneralPipelineDefinitionProvider implements vscode.DefinitionProvider {
  spec: PipelineSpec

  constructor(spec: PipelineSpec) {
    this.spec = spec
  }

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.LocationLink[] | null> {
    const result = locatePipelineToken(document, position, this.spec)
    if (!result) {
      return null
    }
    if (result.type === 'task') {
      const taskIndex = await this.spec.buildTaskIndex(document)
      if (!taskIndex) {
        return null
      }
      const startPos = document.offsetAt(result.range.start)
      const endPos = document.offsetAt(result.range.end)
      for (const { task, prefix, suffix } of this.spec.getTaskFallback(result.value)) {
        if (!(task in taskIndex)) {
          continue
        }
        const range = new vscode.Range(
          document.positionAt(startPos + prefix),
          document.positionAt(endPos - suffix)
        )
        const taskInfo = taskIndex[task]
        return taskInfo.locations.map(loc => ({
          ...loc,
          originSelectionRange: range
        }))
      }
      return null
    } else if (result.type === 'image') {
      const res: vscode.LocationLink[] = []
      let root = this.spec.getRoot(document)
      while (root) {
        const imageRoot = this.spec.getImageRoot(root)
        if (imageRoot) {
          const imagePath = path.join(imageRoot, result.value)
          if (existsSync(imagePath)) {
            res.push({
              originSelectionRange: result.range,
              targetUri: vscode.Uri.file(imagePath),
              targetRange: new vscode.Range(0, 0, 0, 0)
            })
          }
        }
        root = this.spec.fallbackRoot(root)
      }
      if (res) {
        return res
      } else {
        return null
      }
    } else if (result.type === 'entry') {
      const taskIndex = await this.spec.buildTaskIndex(document)
      if (!taskIndex) {
        return null
      }
      const startPos = document.offsetAt(result.range.start)
      const endPos = document.offsetAt(result.range.end)
      for (const { task, prefix, suffix } of this.spec.getTaskFallback(result.value).slice(1)) {
        if (!(task in taskIndex)) {
          continue
        }
        const range = new vscode.Range(
          document.positionAt(startPos + prefix),
          document.positionAt(endPos - suffix)
        )
        const taskInfo = taskIndex[task]
        return taskInfo.locations.map(loc => ({
          ...loc,
          originSelectionRange: range
        }))
      }
      return null
    }
    return null
  }
}

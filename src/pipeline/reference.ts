import { existsSync } from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

import type { PipelineSpec } from './types'
import { locatePipelineToken } from './utils'

export class GeneralPipelineReferenceProvider implements vscode.ReferenceProvider {
  spec: PipelineSpec

  constructor(spec: PipelineSpec) {
    this.spec = spec
  }

  async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ): Promise<vscode.Location[] | null> {
    const result = locatePipelineToken(document, position, this.spec)
    if (!result) {
      return null
    }
    if (result.type === 'task' || result.type === 'entry') {
      const taskIndex = await this.spec.buildTaskIndex(document)
      if (!taskIndex) {
        return null
      }
      let findTask = result.value
      if (result.type === 'task') {
        for (const { task } of this.spec.getTaskFallback(result.value)) {
          if (task in taskIndex) {
            findTask = task
            break
          }
        }
      }
      if (findTask in taskIndex) {
        if (context.includeDeclaration) {
          return [
            ...taskIndex[findTask].locations.map(
              link =>
                new vscode.Location(link.targetUri, link.targetSelectionRange ?? link.targetRange)
            ),
            ...taskIndex[findTask].references
          ]
        } else {
          return taskIndex[findTask].references
        }
      } else {
        return null
      }
    }
    return null
  }
}

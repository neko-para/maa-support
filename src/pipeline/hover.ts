import { existsSync, statSync } from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

import { formatJson } from '../utils/json'
import type { PipelineSpec } from './types'
import { locatePipelineToken } from './utils'

export class GeneralPipelineHoverProvider implements vscode.HoverProvider {
  spec: PipelineSpec

  constructor(spec: PipelineSpec) {
    this.spec = spec
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
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
        const defaultLocation = taskInfo.locations[0]
        const doc = await vscode.workspace.openTextDocument(defaultLocation.targetUri)
        const text = await formatJson(doc.getText(defaultLocation.targetRange))
        const hover = new vscode.Hover(`${task}\n\n\`\`\`json\n${text}\n\`\`\``)
        hover.range = range
        return hover
      }
      return null
    } else if (result.type === 'image' || result.type === 'entry') {
      const imageFiles: [string, vscode.Range][] = []
      if (result.type === 'image') {
        imageFiles.push([result.value, result.range])
      } else {
        if (this.spec.getTaskImage) {
          const startPos = document.offsetAt(result.range.start)
          const endPos = document.offsetAt(result.range.end)
          imageFiles.push(
            ...this.spec
              .getTaskFallback(result.value)
              .map(
                ({ task, prefix, suffix }) =>
                  [
                    this.spec.getTaskImage!(task),
                    new vscode.Range(
                      document.positionAt(startPos + prefix),
                      document.positionAt(endPos - suffix)
                    )
                  ] as [string, vscode.Range]
              )
          )
        }
      }
      let hover: vscode.Hover | null = null
      for (const [imageFile, range] of imageFiles) {
        let root = this.spec.getRoot(document)
        while (root) {
          const imageRoot = this.spec.getImageRoot(root)
          if (imageRoot) {
            const image = path.join(imageRoot, imageFile)
            if (existsSync(image) && statSync(image).isFile()) {
              hover = new vscode.Hover(
                new vscode.MarkdownString(
                  `[${imageFile}](${vscode.Uri.file(image)})\n\n![](${vscode.Uri.file(image)})`
                )
              )
              hover.range = range
              break
            }
          }
          if (hover) {
            break
          }
          root = this.spec.fallbackRoot(root)
        }
      }
      if (!hover) {
        if (imageFiles.length > 0) {
          hover = new vscode.Hover(new vscode.MarkdownString(`未找到对应图片`))
        } else {
          hover = new vscode.Hover(new vscode.MarkdownString(`没有提供图片`))
        }
      }
      return hover
    } else {
      return null
    }
  }
}

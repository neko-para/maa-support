import { existsSync, statSync } from 'fs'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as vscode from 'vscode'

import { PipelineSpec, PipelineTaskCompletionData } from './types'
import { locatePipelineToken } from './utils'

interface CompletionWithData extends vscode.CompletionItem {
  data?: {
    type: string
    info: unknown
  }
}

interface TaskCompletion extends CompletionWithData {
  data?: PipelineTaskCompletionData
}

export class GeneralPipelineCompletionProvider implements vscode.CompletionItemProvider {
  spec: PipelineSpec

  constructor(spec: PipelineSpec) {
    this.spec = spec
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | null> {
    const result = locatePipelineToken(document, position, this.spec)
    if (!result) {
      return null
    }
    if (result.type === 'task') {
      const taskIndex = await this.spec.buildTaskIndex(document)
      if (!taskIndex) {
        return null
      }
      if (result.value === '') {
        return Object.entries(taskIndex).map(([task, info]) => {
          const escaped = JSON.stringify(task)
          const item = new vscode.CompletionItem(
            escaped,
            vscode.CompletionItemKind.Reference
          ) as TaskCompletion
          item.range = result.range
          item.sortText = ' ' + escaped
          item.data = {
            type: 'task',
            info
          }
          return item
        })
      } else if (this.spec.extraTaskCompletion) {
        const info = await this.spec.extraTaskCompletion(
          taskIndex,
          result.value.slice(-1),
          result.value
        )
        if (!info) {
          return null
        }
        return info.items.map(it => {
          if (info.overrite) {
            const escaped = JSON.stringify(it.text)
            const item = new vscode.CompletionItem(escaped, info.kind) as TaskCompletion
            item.range = result.range
            item.sortText = ' ' + escaped
            if (it.data) {
              item.data = it.data
            }
            return item
          } else {
            const escaped = JSON.stringify(it.text).slice(1, -1)
            const item = new vscode.CompletionItem(escaped, info.kind) as TaskCompletion
            item.filterText = result.value.slice(-1) + escaped
            item.sortText = ' ' + item.filterText
            if (it.data) {
              item.data = it.data
            }
            return item
          }
        })
      } else {
        return null
      }
    } else if (result.type === 'image') {
      let root = this.spec.getRoot(document)
      let fallbackCount = 0
      const res: vscode.CompletionItem[] = []
      while (root) {
        const imageRoot = this.spec.getImageRoot(root)
        if (imageRoot) {
          let scanDir = '.'
          if (result.value.endsWith('/')) {
            scanDir = result.value
          }
          const scanFullDir = path.normalize(path.join(imageRoot, scanDir))
          if (existsSync(scanFullDir) && statSync(scanFullDir).isDirectory()) {
            for (const sub of await fs.readdir(scanFullDir, { recursive: true })) {
              const subfile = path.join(scanFullDir, sub)
              if (!statSync(subfile).isFile()) {
                continue
              }
              const escaped = JSON.stringify(path.join(scanDir, sub).replaceAll('\\', '/'))
              const item = new vscode.CompletionItem(escaped, vscode.CompletionItemKind.File)
              item.range = result.range
              item.sortText = ' ' + '~'.repeat(fallbackCount) + escaped
              item.documentation = new vscode.MarkdownString(`![](${vscode.Uri.file(subfile)})`)
              res.push(item)
            }
          }
        }
        root = this.spec.fallbackRoot(root)
        fallbackCount += 1
      }
      if (res) {
        return res
      } else {
        return null
      }
    }
    return null
  }

  async resolveCompletionItem(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem> {
    const dataItem = item as CompletionWithData
    if (dataItem.data) {
      if (dataItem.data.type === 'task') {
        const data = (item as TaskCompletion).data!.info
        if (data.locations.length > 0) {
          const loc = data.locations[0]
          const doc = await vscode.workspace.openTextDocument(loc.targetUri)
          let text = doc.getText(loc.targetRange)
          try {
            text = JSON.stringify(JSON.parse(text), null, 2)
          } catch (_) {}
          item.documentation = new vscode.MarkdownString(`\`\`\`json\n${text}\n\`\`\``)
        }
      }
    }
    return item
  }
}

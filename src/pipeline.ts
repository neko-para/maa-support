import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import { type JSONPath, visit } from 'jsonc-parser'
import * as path from 'path'
import * as vscode from 'vscode'

interface CompletionWithData extends vscode.CompletionItem {
  data?: {
    type: string
    info: unknown
  }
}

interface TaskCompletion extends CompletionWithData {
  data?: {
    type: 'task'
    info: {
      locations: vscode.LocationLink[]
    }
  }
}

function isTaskPath(jp: JSONPath) {
  if (jp.length < 2 || jp.length > 3) {
    return false
  }
  if (typeof jp[0] !== 'string' || typeof jp[1] !== 'string') {
    return false
  }
  if (jp.length === 3 && typeof jp[2] !== 'number') {
    return false
  }
  if (jp[0].startsWith('$')) {
    return false
  }
  if (!['next', 'timeout_next', 'runout_next'].includes(jp[1])) {
    return false
  }
  return true
}

function isImagePath(jp: JSONPath) {
  if (jp.length < 2 || jp.length > 3) {
    return false
  }
  if (typeof jp[0] !== 'string' || typeof jp[1] !== 'string') {
    return false
  }
  if (jp.length === 3 && typeof jp[2] !== 'number') {
    return false
  }
  if (jp[0].startsWith('$')) {
    return false
  }
  if (!['template'].includes(jp[1])) {
    return false
  }
  return true
}

function locateRoot(dir: string) {
  let maxUpCount = 5
  while (maxUpCount--) {
    if (!existsSync(dir)) {
      return null
    }
    if (existsSync(path.join(dir, 'properties.json'))) {
      return dir
    } else {
      dir = path.dirname(dir)
    }
  }
  return null
}

async function buildTaskIndex(dir: string) {
  const root = locateRoot(dir)
  if (!root) {
    return null
  }
  const pipeline = path.join(root, 'pipeline')

  const index: Record<string, vscode.LocationLink[]> = {}
  for (const sub of await fs.readdir(pipeline, {
    recursive: true
  })) {
    if (!sub.endsWith('.json')) {
      continue
    }
    const subpath = path.join(dir, sub)
    if (!(await fs.stat(subpath)).isFile()) {
      continue
    }
    const doc = await vscode.workspace.openTextDocument(subpath)
    let depth: number | null = null
    let link: vscode.LocationLink | null = null
    visit(doc.getText(), {
      onObjectProperty(property, offset, length, startLine, startCharacter, pathSupplier) {
        if (pathSupplier().length !== 0) {
          return
        }
        if (property.startsWith('$')) {
          return
        }
        depth = 0
        link = {
          targetUri: vscode.Uri.file(subpath),
          targetRange: new vscode.Range(
            new vscode.Position(startLine, startCharacter),
            new vscode.Position(startLine, startCharacter)
          ), // fake position
          targetSelectionRange: new vscode.Range(
            new vscode.Position(startLine, startCharacter),
            doc.positionAt(offset + length)
          )
        }
        index[property] = [...(index[property] ?? []), link]
      },
      onObjectBegin(offset, length, startLine, startCharacter, pathSupplier) {
        if (depth !== null) {
          depth += 1
          if (depth === 1) {
            link!.targetRange = new vscode.Range(
              new vscode.Position(startLine, startCharacter),
              new vscode.Position(startLine, startCharacter)
            )
          }
        }
      },
      onObjectEnd(offset, length, startLine, startCharacter) {
        if (depth !== null) {
          depth -= 1
          if (depth === 0) {
            depth = null
            link!.targetRange = new vscode.Range(
              link!.targetRange.start,
              new vscode.Position(startLine, startCharacter + 1)
            )
          }
        }
      }
    })
  }
  return index
}

class PipelineFindTaskToken {
  task: string
  from: vscode.Range

  constructor(task: string, from: vscode.Range) {
    this.task = task
    this.from = from
  }
}

class PipelineFindImageToken {
  image: string
  from: vscode.Range

  constructor(image: string, from: vscode.Range) {
    this.image = image
    this.from = from
  }
}

function findLiteralToken(document: vscode.TextDocument, position: vscode.Position) {
  visit(document.getText(), {
    onLiteralValue(value, offset, length, startLine, startCharacter, pathSupplier) {
      const startPos = new vscode.Position(startLine, startCharacter)
      const endPos = document.positionAt(offset + length)
      if (position.isAfterOrEqual(startPos) && position.isBeforeOrEqual(endPos)) {
        const jp = pathSupplier()
        if (typeof value === 'string' && isTaskPath(jp)) {
          throw new PipelineFindTaskToken(value, new vscode.Range(startPos, endPos))
        } else if (typeof value === 'string' && isImagePath(jp)) {
          throw new PipelineFindImageToken(value, new vscode.Range(startPos, endPos))
        }
      }
    }
  })
}

export class PipelineLanguageSupport
  implements vscode.DefinitionProvider, vscode.HoverProvider, vscode.CompletionItemProvider
{
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    try {
      findLiteralToken(document, position)
      return null
    } catch (result: unknown) {
      if (result instanceof PipelineFindTaskToken) {
        return new Promise<vscode.LocationLink[] | null>(resolve => {
          buildTaskIndex(path.dirname(document.fileName)).then(index => {
            if (!index) {
              resolve(null)
              return
            }
            if (result.task in index) {
              const loc = index[result.task]
              resolve(loc)
            } else {
              resolve(null)
            }
          })
        })
      } else if (result instanceof PipelineFindImageToken) {
        const root = locateRoot(document.fileName)
        if (!root) {
          return null
        }
        const p = path.join(root, 'image', result.image)
        if (existsSync(p)) {
          return [
            {
              originSelectionRange: result.from,
              targetUri: vscode.Uri.file(p),
              targetRange: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))
            }
          ]
        } else {
          return null
        }
      }
      return null
    }
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    try {
      findLiteralToken(document, position)
      return null
    } catch (result: unknown) {
      if (result instanceof PipelineFindTaskToken) {
        return new Promise<vscode.Hover | null>(resolve => {
          buildTaskIndex(path.dirname(document.fileName)).then(index => {
            if (!index) {
              resolve(null)
              return
            }
            if (result.task in index) {
              const locs = index[result.task]
              if (locs.length > 0) {
                const loc = locs[0]
                new Promise<vscode.Hover>(async resolve => {
                  const doc = await vscode.workspace.openTextDocument(loc.targetUri)
                  let text = doc.getText(loc.targetRange)
                  try {
                    text = JSON.stringify(JSON.parse(text), null, 2)
                  } catch (_) {}
                  const hv = new vscode.Hover(
                    new vscode.MarkdownString(`\`\`\`json\n${text}\n\`\`\``)
                  )
                  hv.range = result.from
                  resolve(hv)
                }).then(resolve)
              } else {
                resolve(null)
              }
            } else {
              resolve(null)
            }
          })
        })
      } else if (result instanceof PipelineFindImageToken) {
        const root = locateRoot(document.fileName)
        if (!root) {
          return null
        }
        const p = path.join(root, 'image', result.image)
        return new Promise<vscode.Hover>(async resolve => {
          let hover
          if (existsSync(p) && (await fs.stat(p)).isFile()) {
            hover = new vscode.Hover(new vscode.MarkdownString(`![](${p})`))
          } else {
            hover = new vscode.Hover(new vscode.MarkdownString(`这玩意不存在`))
          }
          hover.range = result.from
          resolve(hover)
        })
      }
      return null
    }
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionList<vscode.CompletionItem> | vscode.CompletionItem[]> {
    try {
      findLiteralToken(document, position)
      return null
    } catch (result: unknown) {
      if (result instanceof PipelineFindTaskToken) {
        return new Promise<vscode.CompletionItem[] | null>(resolve => {
          buildTaskIndex(path.dirname(document.fileName)).then(index => {
            if (!index) {
              resolve(null)
              return
            }

            resolve(
              Object.entries(index)
                .filter(([name]) => name.startsWith(result.task))
                .map(([name, locs]) => {
                  const escaped = JSON.stringify(name)
                  const item = new vscode.CompletionItem(
                    escaped,
                    vscode.CompletionItemKind.Reference
                  ) as TaskCompletion
                  item.range = result.from
                  item.sortText = ' ' + escaped
                  item.data = {
                    type: 'task',
                    info: {
                      locations: locs
                    }
                  }
                  return item
                })
            )
          })
        })
      } else if (result instanceof PipelineFindImageToken) {
        const root = locateRoot(document.fileName)
        if (!root) {
          return null
        }
        const imageRoot = path.join(root, 'image')
        return new Promise<vscode.CompletionItem[] | null>(async resolve => {
          if (result.image === '') {
            const res: vscode.CompletionItem[] = []
            for (const sub of await fs.readdir(imageRoot, { recursive: true })) {
              const subfile = path.join(imageRoot, sub)
              if ((await fs.stat(subfile)).isFile()) {
                const escaped = JSON.stringify(sub)
                const item = new vscode.CompletionItem(escaped, vscode.CompletionItemKind.File)
                item.range = result.from
                item.sortText = ' ' + escaped
                item.documentation = new vscode.MarkdownString(`![](${subfile})`)
                res.push(item)
              }
            }
            if (res) {
              resolve(res)
            } else {
              resolve(null)
            }
          } else {
            if (result.image.endsWith('/')) {
              const filterRoot = path.join(imageRoot, result.image)
              if (!existsSync(filterRoot)) {
                resolve(null)
                return
              }
              const res: vscode.CompletionItem[] = []
              for (const sub of await fs.readdir(filterRoot, { recursive: true })) {
                const subfile = path.join(filterRoot, sub)
                const substr = path.join(result.image, sub)
                if ((await fs.stat(subfile)).isFile()) {
                  const escaped = JSON.stringify(substr)
                  const item = new vscode.CompletionItem(escaped, vscode.CompletionItemKind.File)
                  item.range = result.from
                  item.sortText = ' ' + escaped
                  item.documentation = new vscode.MarkdownString(`![](${subfile})`)
                  res.push(item)
                }
              }
              resolve(res)
            } else {
              resolve(null)
            }
          }
        })
      }
      return null
    }
  }

  resolveCompletionItem?(
    item: CompletionWithData,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    if (item.data) {
      switch (item.data.type) {
        case 'task': {
          const data = (item as TaskCompletion).data!.info
          if (data.locations.length > 0) {
            const loc = data.locations[0]
            return new Promise<vscode.CompletionItem>(async resolve => {
              const doc = await vscode.workspace.openTextDocument(loc.targetUri)
              let text = doc.getText(loc.targetRange)
              try {
                text = JSON.stringify(JSON.parse(text), null, 2)
              } catch (_) {}
              item.documentation = new vscode.MarkdownString(`\`\`\`json\n${text}\n\`\`\``)
              resolve(item)
            })
          }
        }
      }
    }
    return item
  }
}

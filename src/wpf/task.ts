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
  if (jp.length !== 3) {
    return false
  }
  if (typeof jp[0] !== 'string' || typeof jp[1] !== 'string' || typeof jp[2] !== 'number') {
    return false
  }
  if (!['sub', 'next', 'onErrorNext', 'exceededNext', 'reduceOtherTimes'].includes(jp[1])) {
    return false
  }
  return true
}

function isImagePath(jp: JSONPath) {
  if (jp.length !== 2) {
    return false
  }
  if (typeof jp[0] !== 'string' || jp[1] !== 'template') {
    return false
  }
  return true
}

async function buildTaskIndex(doc: vscode.TextDocument) {
  const index: Record<string, vscode.LocationLink[]> = {}

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
        targetUri: doc.uri,
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

  const baseTasksFile = path.join(path.dirname(doc.fileName), '..', '..', '..', 'tasks.json')
  if (existsSync(baseTasksFile)) {
    const baseTasks = await buildTaskIndex(await vscode.workspace.openTextDocument(baseTasksFile))
    for (const task in baseTasks) {
      index[task] = [...(index[task] ?? []), ...baseTasks[task]]
    }
  }

  return index
}

function getInheritChain(k: string) {
  const result: string[] = [k]
  while (true) {
    const match = /^[^@]+@([\s\S]+)$/.exec(k)
    if (match) {
      k = match[1]
      result.push(k)
    } else {
      return result
    }
  }
}

class PipelineFindTaskToken {
  task: string
  from: vscode.Range

  constructor(task: string, from: vscode.Range) {
    this.task = task
    this.from = from
  }
}

class PipelineFindTaskEntryToken {
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
    },
    onObjectProperty(property, offset, length, startLine, startCharacter, pathSupplier) {
      const startPos = new vscode.Position(startLine, startCharacter)
      const endPos = document.positionAt(offset + length)
      if (position.isAfterOrEqual(startPos) && position.isBeforeOrEqual(endPos)) {
        if (pathSupplier().length === 0) {
          throw new PipelineFindTaskEntryToken(property, new vscode.Range(startPos, endPos))
        }
      }
    }
  })
}

export class WpfTaskLanguageSupport
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
          buildTaskIndex(document).then(index => {
            if (!index) {
              resolve(null)
              return
            }
            for (const rawTaskName of getInheritChain(result.task)) {
              const taskName = rawTaskName.replace(/#[^#]+$/, '')
              if (taskName in index) {
                const locs = index[taskName]
                const prefixRemove = result.task.length - taskName.length
                resolve(
                  locs.map(loc => ({
                    ...loc,
                    originSelectionRange: new vscode.Range(
                      new vscode.Position(
                        result.from.start.line,
                        result.from.start.character + (prefixRemove > 0 ? prefixRemove + 1 : 0)
                      ),
                      result.from.end
                    )
                  }))
                )
                return
              }
            }
            resolve(null)
            return
          })
        })
      } else if (result instanceof PipelineFindImageToken) {
        const root = path.dirname(document.fileName)
        if (!root) {
          return null
        }
        const ps = [
          path.join(root, 'template', result.image),
          path.join(root, '..', '..', '..', 'template', result.image)
        ]
        for (const p of ps) {
          if (existsSync(p)) {
            return [
              {
                originSelectionRange: result.from,
                targetUri: vscode.Uri.file(p),
                targetRange: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))
              }
            ]
          }
        }
        return null
      } else if (result instanceof PipelineFindTaskEntryToken) {
        return new Promise<vscode.LocationLink[] | null>(resolve => {
          buildTaskIndex(document).then(index => {
            if (!index) {
              resolve(null)
              return
            }
            const chain = getInheritChain(result.task)
            for (const rawTaskName of chain.slice(1)) {
              const taskName = rawTaskName.replace(/#[^#]+$/, '')
              if (taskName in index) {
                const locs = index[taskName]
                resolve(
                  locs.map(loc => ({
                    ...loc,
                    originSelectionRange: new vscode.Range(
                      new vscode.Position(
                        result.from.start.line,
                        result.from.start.character + result.task.length - taskName.length + 1
                      ),
                      result.from.end
                    )
                  }))
                )
                return
              }
            }
            resolve(null)
          })
        })
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
          buildTaskIndex(document).then(index => {
            if (!index) {
              resolve(null)
              return
            }
            for (const rawTaskName of getInheritChain(result.task)) {
              const taskName = rawTaskName.replace(/#[^#]+$/, '')
              if (taskName in index) {
                const locs = index[taskName]
                if (locs.length > 0) {
                  const loc = locs[0]
                  new Promise<vscode.Hover>(async resolve => {
                    const doc = await vscode.workspace.openTextDocument(loc.targetUri)
                    let text = doc.getText(loc.targetRange)
                    try {
                      text = JSON.stringify(JSON.parse(text), null, 2)
                    } catch (_) {}
                    const hv = new vscode.Hover(
                      new vscode.MarkdownString(`${taskName}\n\n\`\`\`json\n${text}\n\`\`\``)
                    )
                    hv.range = result.from
                    resolve(hv)
                  }).then(resolve)
                } else {
                  resolve(null)
                }
                return
              }
            }
            resolve(null)
            return
          })
        })
      } else if (
        result instanceof PipelineFindImageToken ||
        result instanceof PipelineFindTaskEntryToken
      ) {
        const root = path.dirname(document.fileName)
        if (!root) {
          return null
        }
        let image: string
        if (result instanceof PipelineFindImageToken) {
          image = result.image
        } else {
          image = result.task.replace(/#[^#]+$/, '') + '.png'
        }
        const fullPaths = [
          path.join(root, 'template', image),
          path.join(root, '..', '..', '..', 'template', image)
        ]
        return new Promise<vscode.Hover>(async resolve => {
          let hover = new vscode.Hover(new vscode.MarkdownString(`这玩意不存在`))
          let found = false
          for (const fullPath of fullPaths) {
            const fileChain = getInheritChain(image)
            for (const [idx, imagePath] of getInheritChain(fullPath).entries()) {
              if (existsSync(imagePath) && (await fs.stat(imagePath)).isFile()) {
                hover = new vscode.Hover(
                  new vscode.MarkdownString(
                    `${fileChain[idx]}\n\n![](${vscode.Uri.file(imagePath)})`
                  )
                )
                found = true
                break
              }
            }
            if (found) {
              break
            }
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
        if (result.task === '') {
          return new Promise<vscode.CompletionItem[] | null>(resolve => {
            buildTaskIndex(document).then(index => {
              if (!index) {
                resolve(null)
                return
              }

              resolve(
                Object.entries(index).map(([name, locs]) => {
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
        } else if (result.task.endsWith('@')) {
          return new Promise<vscode.CompletionItem[] | null>(resolve => {
            buildTaskIndex(document).then(index => {
              if (!index) {
                resolve(null)
                return
              }

              resolve(
                Object.entries(index)
                  .map(
                    ([name, locs]) => [result.task + name, locs] as [string, vscode.LocationLink[]]
                  )
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
        } else if (result.task.endsWith('#')) {
          return [
            'self',
            'back',
            'next',
            'sub',
            'on_error_next',
            'exceeded_next',
            'reduce_other_times'
          ].map(sub => {
            const item = new vscode.CompletionItem(sub, vscode.CompletionItemKind.Enum)
            item.filterText = '#' + sub
            return item
          })
        } else {
          return null
        }
      } else if (result instanceof PipelineFindImageToken) {
        const root = path.dirname(document.fileName)
        if (!root) {
          return null
        }
        const imageRoots = [
          path.join(root, 'template'),
          path.join(root, '..', '..', '..', 'template')
        ]
        return new Promise<vscode.CompletionItem[] | null>(async resolve => {
          if (result.image === '') {
            const res: vscode.CompletionItem[] = []
            for (const [plat, imageRoot] of imageRoots.entries()) {
              if (!existsSync(imageRoot)) {
                continue
              }
              for (const sub of await fs.readdir(imageRoot, { recursive: true })) {
                const subfile = path.join(imageRoot, sub)
                if ((await fs.stat(subfile)).isFile()) {
                  const escaped = JSON.stringify(sub.replaceAll('\\', '/'))
                  const item = new vscode.CompletionItem(escaped, vscode.CompletionItemKind.File)
                  item.range = result.from
                  item.sortText = ' '.repeat(3 - plat) + escaped
                  item.documentation = new vscode.MarkdownString(`![](${vscode.Uri.file(subfile)})`)
                  res.push(item)
                }
              }
            }
            if (res) {
              resolve(res)
            } else {
              resolve(null)
            }
          } else {
            if (result.image.endsWith('/')) {
              const res: vscode.CompletionItem[] = []
              for (const [plat, imageRoot] of imageRoots.entries()) {
                if (!existsSync(imageRoot)) {
                  continue
                }
                const filterRoot = path.join(imageRoot, result.image)
                if (!existsSync(filterRoot)) {
                  continue
                }
                for (const sub of await fs.readdir(filterRoot, { recursive: true })) {
                  const subfile = path.join(filterRoot, sub)
                  const substr = path.join(result.image, sub)
                  if ((await fs.stat(subfile)).isFile()) {
                    const escaped = JSON.stringify(substr.replaceAll('\\', '/'))
                    const item = new vscode.CompletionItem(escaped, vscode.CompletionItemKind.File)
                    item.range = result.from
                    item.sortText = ' '.repeat(3 - plat) + escaped
                    item.documentation = new vscode.MarkdownString(
                      `![](${vscode.Uri.file(subfile)})`
                    )
                    res.push(item)
                  }
                }
              }
              if (res) {
                resolve(res)
              } else {
                resolve(null)
              }
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

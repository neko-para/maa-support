import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import { type JSONPath, visit } from 'jsonc-parser'
import * as path from 'path'
import * as vscode from 'vscode'

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

  const index: Record<string, vscode.Location[]> = {}
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
    const content = await fs.readFile(subpath, 'utf-8')
    visit(content, {
      onObjectProperty(property, offset, length, startLine, startCharacter, pathSupplier) {
        if (pathSupplier().length !== 0) {
          return
        }
        if (property.startsWith('$')) {
          return
        }
        index[property] = [
          ...(index[property] ?? []),
          new vscode.Location(
            vscode.Uri.file(subpath),
            new vscode.Position(startLine, startCharacter)
          )
        ]
      }
    })
  }
  return index
}

class PipelineFindTaskToken {
  task: string

  constructor(task: string) {
    this.task = task
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

export class PipelineLanguageSupport implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    try {
      visit(document.getText(), {
        onLiteralValue(value, offset, length, startLine, startCharacter, pathSupplier) {
          const startPos = new vscode.Position(startLine, startCharacter)
          const endPos = document.positionAt(offset + length)
          if (position.isAfterOrEqual(startPos) && position.isBeforeOrEqual(endPos)) {
            const jp = pathSupplier()
            if (typeof value === 'string' && isTaskPath(jp)) {
              throw new PipelineFindTaskToken(value)
            } else if (typeof value === 'string' && isImagePath(jp)) {
              throw new PipelineFindImageToken(value, new vscode.Range(startPos, endPos))
            }
          }
        }
      })
      return null
    } catch (result: unknown) {
      if (result instanceof PipelineFindTaskToken) {
        return new Promise<vscode.Location[] | null>(resolve => {
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
}

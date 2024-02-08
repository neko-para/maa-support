import { existsSync, statSync } from 'fs'
import * as fs from 'fs/promises'
import { visit } from 'jsonc-parser'
import * as path from 'path'
import * as vscode from 'vscode'

import { PipelineSpec, PipelineTaskIndex } from '../types'

export const MaaFrameworkPipelineSpec = {
  isTaskPath(path) {
    if (path.length < 2 || path.length > 3) {
      return false
    }
    if (typeof path[0] !== 'string' || typeof path[1] !== 'string') {
      return false
    }
    if (path.length === 3 && typeof path[2] !== 'number') {
      return false
    }
    if (path[0].startsWith('$')) {
      return false
    }
    if (!['next', 'timeout_next', 'runout_next'].includes(path[1])) {
      return false
    }
    return true
  },

  isImagePath(path) {
    if (path.length < 2 || path.length > 3) {
      return false
    }
    if (typeof path[0] !== 'string' || typeof path[1] !== 'string') {
      return false
    }
    if (path.length === 3 && typeof path[2] !== 'number') {
      return false
    }
    if (path[0].startsWith('$')) {
      return false
    }
    if (!['template'].includes(path[1])) {
      return false
    }
    return true
  },

  isEntryPath(path) {
    return path.length === 0
  },

  getRoot(doc) {
    let dir = path.dirname(doc.fileName)
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
  },

  fallbackRoot() {
    return null
  },

  getImageRoot(root) {
    const imageRoot = path.join(root, 'image')
    return existsSync(imageRoot) && statSync(imageRoot).isDirectory() ? imageRoot : null
  },

  async buildTaskIndex(doc) {
    const root = this.getRoot(doc)
    if (!root) {
      return null
    }
    const pipeline = path.join(root, 'pipeline')

    const index: PipelineTaskIndex = {}
    for (const sub of await fs.readdir(pipeline, {
      recursive: true
    })) {
      if (!sub.endsWith('.json')) {
        continue
      }
      const subpath = path.join(pipeline, sub)
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
          const info = index[property] ?? {
            locations: []
          }
          info.locations.push(link)
          index[property] = info
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
  },

  getTaskFallback(task) {
    return [
      {
        task,
        prefix: 0,
        suffix: 0
      }
    ]
  }
} satisfies PipelineSpec

import { existsSync, statSync } from 'fs'
import * as fs from 'fs/promises'
import { visit } from 'jsonc-parser'
import * as path from 'path'
import * as vscode from 'vscode'

import { PipelineSpec, PipelineTaskIndex } from '../types'

function clearHash(task: string) {
  return task.replaceAll(/#[^#]+$/g, '')
}

export const MaaWpfPipelineSpec = {
  isTaskPath(path) {
    if (path.length !== 3) {
      return false
    }
    if (typeof path[0] !== 'string' || typeof path[1] !== 'string' || typeof path[2] !== 'number') {
      return false
    }
    if (!['sub', 'next', 'onErrorNext', 'exceededNext', 'reduceOtherTimes'].includes(path[1])) {
      return false
    }
    return true
  },

  isImagePath(path) {
    if (path.length !== 2) {
      return false
    }
    if (typeof path[0] !== 'string' || path[1] !== 'template') {
      return false
    }
    return true
  },

  isEntryPath(path) {
    return path.length === 0
  },

  getRoot(doc) {
    return path.dirname(doc.fileName)
  },

  fallbackRoot(root) {
    const newRoot = path.normalize(path.join(root, '..', '..', '..'))
    if (existsSync(path.join(newRoot, 'tasks.json'))) {
      return newRoot
    } else {
      return null
    }
  },

  getImageRoot(root) {
    const imageRoot = path.join(root, 'template')
    return existsSync(imageRoot) && statSync(imageRoot).isDirectory() ? imageRoot : null
  },

  getTaskImage(task) {
    return clearHash(task) + '.png'
  },

  async buildTaskIndex(doc) {
    const index: PipelineTaskIndex = {}

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

    const baseTasksFile = path.join(path.dirname(doc.fileName), '..', '..', '..', 'tasks.json')
    if (existsSync(baseTasksFile)) {
      const baseTasks = await this.buildTaskIndex(
        await vscode.workspace.openTextDocument(baseTasksFile)
      )
      for (const task in baseTasks) {
        const info = index[task] ?? {
          locations: []
        }
        info.locations.push(...baseTasks[task].locations)
        index[task] = info
      }
    }

    return index
  },

  getTaskFallback(task) {
    const clearedTask = clearHash(task)
    const suffix = task.length - clearedTask.length
    const res: {
      task: string
      prefix: number
      suffix: number
    }[] = [
      {
        task: clearedTask,
        prefix: 0,
        suffix
      }
    ]
    let taskIter = clearedTask
    while (true) {
      const match = /^[^@]+@([\s\S]+$)/.exec(taskIter)
      if (match) {
        taskIter = match[1]
        res.push({
          task: taskIter,
          prefix: clearedTask.length - taskIter.length,
          suffix
        })
      } else {
        break
      }
    }
    return res
  },

  async extraTaskCompletion(index, suffix, current) {
    if (suffix === '@') {
      return {
        kind: vscode.CompletionItemKind.Reference,
        overrite: true,
        items: Object.entries(index).map(([name, info]) => {
          return {
            text: current + name,
            data: {
              type: 'task',
              info
            }
          }
        })
      }
    } else if (suffix === '#') {
      return {
        kind: vscode.CompletionItemKind.Enum,
        overrite: false,
        items: [
          'self',
          'back',
          'next',
          'sub',
          'on_error_next',
          'exceeded_next',
          'reduce_other_times'
        ].map(text => ({ text }))
      }
    }
    return null
  }
} satisfies PipelineSpec

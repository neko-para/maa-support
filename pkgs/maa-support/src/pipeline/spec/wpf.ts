import { existsSync, statSync } from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'

import { PipelineSpec } from '../types'
import { buildTaskIndex } from './utils'

function clearHash(task: string) {
  return task.replaceAll(/#[^#]+$/g, '')
}

export const MaaWpfPipelineSpec = {
  name: 'Maa',

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

  getPipelineRoot(root) {
    return root
  },

  async enumPipeline(root) {
    const file = path.join(root, 'tasks.json')
    if (existsSync(file) && statSync(file).isFile()) {
      return ['tasks.json']
    } else {
      return []
    }
  },

  getImageRoot(root) {
    const imageRoot = path.join(root, 'template')
    return existsSync(imageRoot) && statSync(imageRoot).isDirectory() ? imageRoot : null
  },

  getTaskImage(task) {
    return clearHash(task) + '.png'
  },

  buildTaskIndex,

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

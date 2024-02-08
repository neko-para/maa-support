import { existsSync, statSync } from 'fs'
import * as fs from 'fs/promises'
import * as path from 'path'

import { PipelineSpec } from '../types'
import { buildTaskIndex } from './utils'

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

  getPipelineRoot(root) {
    const pipelineRoot = path.join(root, 'pipeline')
    return existsSync(pipelineRoot) && statSync(pipelineRoot).isDirectory() ? pipelineRoot : null
  },

  async enumPipeline(root) {
    return (
      await fs.readdir(root, {
        recursive: true
      })
    ).filter(file => file.endsWith('.json') && statSync(path.join(root, file)).isFile())
  },

  getImageRoot(root) {
    const imageRoot = path.join(root, 'image')
    return existsSync(imageRoot) && statSync(imageRoot).isDirectory() ? imageRoot : null
  },

  buildTaskIndex,

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

import * as fs from 'fs/promises'
import { JSONPath, visit } from 'jsonc-parser'
import * as path from 'path'
import * as vscode from 'vscode'

import type { PipelineSpec, PipelineTaskIndex } from '../types'

export async function buildTaskIndex(
  this: PipelineSpec,
  doc: vscode.TextDocument | string,
  refEntry?: {
    location: vscode.Location
    target: string
  }[]
) {
  const root = typeof doc === 'string' ? doc : this.getRoot(doc)
  if (!root) {
    return null
  }
  const pipeline = this.getPipelineRoot(root)
  if (!pipeline) {
    return null
  }

  const index: PipelineTaskIndex = {}
  const getOrInit = (task: string) => {
    const info = index[task] ?? {
      locations: [],
      references: []
    }
    index[task] = info
    return info
  }

  const isStarter = !refEntry

  refEntry = refEntry ?? []

  for (const sub of await this.enumPipeline(pipeline)) {
    const subpath = path.join(pipeline, sub)
    const doc = await vscode.workspace.openTextDocument(subpath)
    let depth: number | null = null
    let task: string | null = null
    let link: vscode.LocationLink | null = null

    const isTaskPath = (task: JSONPath) => this.isTaskPath(task)

    visit(doc.getText(), {
      onObjectProperty(property, offset, length, startLine, startCharacter, pathSupplier) {
        if (pathSupplier().length !== 0) {
          return
        }
        if (property.startsWith('$')) {
          return
        }
        depth = 0
        task = property
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
        getOrInit(property).locations.push(link)
      },
      onLiteralValue(value, offset, length, startLine, startCharacter, pathSupplier) {
        if (typeof value === 'string' && depth !== null && isTaskPath(pathSupplier())) {
          refEntry.push({
            location: new vscode.Location(
              doc.uri,
              new vscode.Range(doc.positionAt(offset), doc.positionAt(offset + length))
            ),
            target: value
          })
        }
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

  const baseRoot = this.fallbackRoot(root)
  if (baseRoot) {
    const baseIndex = await buildTaskIndex.call(this, baseRoot, refEntry)
    if (baseIndex) {
      for (const task in baseIndex) {
        const cur = getOrInit(task)
        cur.locations.push(...baseIndex[task].locations)
        cur.references.push(...baseIndex[task].references)
      }
    }
  }

  if (isStarter) {
    for (const { location, target } of refEntry) {
      for (const { task } of this.getTaskFallback(target)) {
        if (task in index) {
          index[task].references.push(location)
          break
        }
      }
    }
  }

  return index
}

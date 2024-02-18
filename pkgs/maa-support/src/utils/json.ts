import { JSONPath, visit } from 'jsonc-parser'
import * as vscode from 'vscode'

type TokenInfo =
  | {
      type: 'string'
      value: string
    }
  | {
      type: 'property'
      value: string
    }

export class FindTokenInfo {
  info: TokenInfo
  range: vscode.Range
  path: JSONPath

  constructor(info: TokenInfo, range: vscode.Range, path: JSONPath) {
    this.info = info
    this.range = range
    this.path = path
  }
}

export function locateToken(document: vscode.TextDocument, position: vscode.Position) {
  visit(document.getText(), {
    onLiteralValue(value, offset, length, startLine, startCharacter, pathSupplier) {
      const startPos = document.positionAt(offset)
      const endPos = document.positionAt(offset + length)
      if (
        typeof value === 'string' &&
        position.isAfterOrEqual(startPos) &&
        position.isBeforeOrEqual(endPos)
      ) {
        throw new FindTokenInfo(
          {
            type: 'string',
            value
          },
          new vscode.Range(startPos, endPos),
          pathSupplier()
        )
      }
    },
    onObjectProperty(property, offset, length, startLine, startCharacter, pathSupplier) {
      const startPos = new vscode.Position(startLine, startCharacter)
      const endPos = document.positionAt(offset + length)
      if (position.isAfterOrEqual(startPos) && position.isBeforeOrEqual(endPos)) {
        throw new FindTokenInfo(
          {
            type: 'property',
            value: property
          },
          new vscode.Range(startPos, endPos),
          pathSupplier()
        )
      }
    }
  })
}

// TODO: use prettier instead
export async function formatJson(text: string) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch (_) {
    return text
  }
}

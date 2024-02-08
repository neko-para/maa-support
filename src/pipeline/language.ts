import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import { type JSONPath, visit } from 'jsonc-parser'
import * as path from 'path'
import * as vscode from 'vscode'

import { GeneralPipelineCompletionProvider } from './completion'
import { GeneralPipelineDefinitionProvider } from './definition'
import { GeneralPipelineHoverProvider } from './hover'
import { PipelineSpec } from './types'

export class GeneralPipelineLanguageSupport
  implements vscode.DefinitionProvider, vscode.HoverProvider, vscode.CompletionItemProvider
{
  spec: PipelineSpec
  definitionProvider: GeneralPipelineDefinitionProvider
  hoverProvider: GeneralPipelineHoverProvider
  completionProvider: GeneralPipelineCompletionProvider

  constructor(spec: PipelineSpec) {
    this.spec = spec
    this.definitionProvider = new GeneralPipelineDefinitionProvider(spec)
    this.hoverProvider = new GeneralPipelineHoverProvider(spec)
    this.completionProvider = new GeneralPipelineCompletionProvider(spec)
  }

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    return this.definitionProvider.provideDefinition(document, position, token)
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ) {
    return this.hoverProvider.provideHover(document, position, token)
  }

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ) {
    return this.completionProvider.provideCompletionItems(document, position, token, context)
  }

  async resolveCompletionItem(item: vscode.CompletionItem, token: vscode.CancellationToken) {
    return this.completionProvider.resolveCompletionItem(item, token)
  }
}

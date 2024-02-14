import * as vscode from 'vscode'

import { GeneralPipelineCompletionProvider } from './completion'
import { GeneralPipelineDefinitionProvider } from './definition'
import { GeneralPipelineHoverProvider } from './hover'
import { GeneralPipelineReferenceProvider } from './reference'
import { PipelineSpec } from './types'

export class GeneralPipelineLanguageSupport
  implements
    vscode.DefinitionProvider,
    vscode.HoverProvider,
    vscode.CompletionItemProvider,
    vscode.ReferenceProvider
{
  spec: PipelineSpec
  definitionProvider: GeneralPipelineDefinitionProvider
  hoverProvider: GeneralPipelineHoverProvider
  completionProvider: GeneralPipelineCompletionProvider
  referenceProvider: GeneralPipelineReferenceProvider

  constructor(spec: PipelineSpec) {
    this.spec = spec
    this.definitionProvider = new GeneralPipelineDefinitionProvider(spec)
    this.hoverProvider = new GeneralPipelineHoverProvider(spec)
    this.completionProvider = new GeneralPipelineCompletionProvider(spec)
    this.referenceProvider = new GeneralPipelineReferenceProvider(spec)
  }

  apply(
    selectors: vscode.DocumentSelector | vscode.DocumentSelector[],
    completionTrigger: string[]
  ) {
    return (Array.isArray(selectors) ? selectors : [selectors])
      .map(selector => {
        return [
          vscode.languages.registerDefinitionProvider(selector, this),
          vscode.languages.registerHoverProvider(selector, this),
          vscode.languages.registerCompletionItemProvider(selector, this, ...completionTrigger),
          vscode.languages.registerReferenceProvider(selector, this)
        ]
      })
      .flat()
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

  async provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.ReferenceContext,
    token: vscode.CancellationToken
  ) {
    return this.referenceProvider.provideReferences(document, position, context, token)
  }
}

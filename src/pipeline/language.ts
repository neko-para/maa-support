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

  statusItem: vscode.StatusBarItem

  constructor(spec: PipelineSpec) {
    this.spec = spec
    this.definitionProvider = new GeneralPipelineDefinitionProvider(spec)
    this.hoverProvider = new GeneralPipelineHoverProvider(spec)
    this.completionProvider = new GeneralPipelineCompletionProvider(spec)
    this.referenceProvider = new GeneralPipelineReferenceProvider(spec)

    this.statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
  }

  apply(selector: vscode.DocumentSelector, completionTrigger: string[]) {
    this.onChangeEditor(selector, vscode.window.activeTextEditor)
    return [
      vscode.languages.registerDefinitionProvider(selector, this),
      vscode.languages.registerHoverProvider(selector, this),
      vscode.languages.registerCompletionItemProvider(selector, this, ...completionTrigger),
      vscode.languages.registerReferenceProvider(selector, this),
      vscode.window.onDidChangeActiveTextEditor(editor => {
        this.onChangeEditor(selector, editor)
      })
    ]
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

  onChangeEditor(selector: vscode.DocumentSelector, editor?: vscode.TextEditor) {
    if (editor && vscode.languages.match(selector, editor.document)) {
      this.updateStatus(editor.document)
    } else {
      this.updateStatus()
    }
  }

  updateStatus(doc?: vscode.TextDocument) {
    if (doc) {
      this.statusItem.show()
      const root = this.spec.getRoot(doc)
      this.statusItem.text = `Maa Support - ${this.spec.name} Mode`
      if (!root) {
        this.statusItem.color = new vscode.ThemeColor('statusBarItem.errorBackground')
        this.statusItem.tooltip = '无法找到项目根目录'
      } else {
        this.statusItem.color = new vscode.ThemeColor('statusBarItem.background')
        this.statusItem.tooltip = `根目录 ${root}`
      }
    } else {
      this.statusItem.hide()
    }
  }
}

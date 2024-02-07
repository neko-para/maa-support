import * as vscode from 'vscode'

import { PipelineLanguageSupport } from './pipeline'

export function activate(context: vscode.ExtensionContext) {
  const pipelineLanguage = new PipelineLanguageSupport()
  const selector = {
    scheme: 'file',
    language: 'json'
  }

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, pipelineLanguage),
    vscode.languages.registerHoverProvider(selector, pipelineLanguage),
    vscode.languages.registerCompletionItemProvider(selector, pipelineLanguage, '"', '/')
  )
}

export function deactivate() {}

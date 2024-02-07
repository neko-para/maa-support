import * as vscode from 'vscode'

import { PipelineLanguageSupport } from './pipeline'
import { WpfTaskLanguageSupport } from './wpf/task'

export function activate(context: vscode.ExtensionContext) {
  const pipelineLanguage = new PipelineLanguageSupport()
  const selector: vscode.DocumentSelector = {
    scheme: 'file',
    language: 'json'
  }

  const wpfTaskLanguage = new WpfTaskLanguageSupport()
  const wpfTaskSelector: vscode.DocumentSelector = {
    scheme: 'file',
    language: 'jsonc',
    pattern: '**/resource/tasks.json'
  }

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(selector, pipelineLanguage),
    vscode.languages.registerHoverProvider(selector, pipelineLanguage),
    vscode.languages.registerCompletionItemProvider(selector, pipelineLanguage, '"', '/'),
    vscode.languages.registerDefinitionProvider(wpfTaskSelector, wpfTaskLanguage),
    vscode.languages.registerHoverProvider(wpfTaskSelector, wpfTaskLanguage)
  )
}

export function deactivate() {}

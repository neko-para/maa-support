import * as vscode from 'vscode'

import { GeneralPipelineLanguageSupport } from './pipeline/language'
import { MaaFrameworkPipelineSpec } from './pipeline/spec/fw'
import { MaaWpfPipelineSpec } from './pipeline/spec/wpf'

export function activate(context: vscode.ExtensionContext) {
  const pipelineLanguage = new GeneralPipelineLanguageSupport(MaaFrameworkPipelineSpec)
  const selector: vscode.DocumentSelector = {
    scheme: 'file',
    language: 'json'
  }

  const wpfTaskLanguage = new GeneralPipelineLanguageSupport(MaaWpfPipelineSpec)
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
    vscode.languages.registerHoverProvider(wpfTaskSelector, wpfTaskLanguage),
    vscode.languages.registerCompletionItemProvider(
      wpfTaskSelector,
      wpfTaskLanguage,
      '"',
      '/',
      '@',
      '#'
    )
  )
}

export function deactivate() {}

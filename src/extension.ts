import * as vscode from 'vscode'

import { PipelineLanguageSupport } from './pipeline'

export function activate(context: vscode.ExtensionContext) {
  const pipelineLanguage = new PipelineLanguageSupport()

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      {
        scheme: 'file',
        language: 'json'
      },
      pipelineLanguage
    )
  )
}

export function deactivate() {}

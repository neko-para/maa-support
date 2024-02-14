import * as vscode from 'vscode'

import { GeneralPipelineLanguageSupport } from './pipeline/language'
import { MaaFrameworkPipelineSpec } from './pipeline/spec/fw'
import { MaaWpfPipelineSpec } from './pipeline/spec/wpf'

export function activate(context: vscode.ExtensionContext) {
  const fwPipelineLSP = new GeneralPipelineLanguageSupport(MaaFrameworkPipelineSpec)
  const fwPipelineSelector: vscode.DocumentSelector[] = [
    {
      scheme: 'file',
      language: 'json'
    },
    {
      scheme: 'file',
      language: 'jsonc'
    }
  ]

  const wpfPipelineLSP = new GeneralPipelineLanguageSupport(MaaWpfPipelineSpec)
  const wpfPipelineSelector: vscode.DocumentSelector = [
    {
      scheme: 'file',
      language: 'json',
      pattern: '**/resource/tasks.json'
    },
    {
      scheme: 'file',
      language: 'jsonc',
      pattern: '**/resource/tasks.json'
    }
  ]

  context.subscriptions.push(
    ...fwPipelineLSP.apply(fwPipelineSelector, ['"', '/']),
    ...wpfPipelineLSP.apply(wpfPipelineSelector, ['"', '/', '@', '#'])
  )
}

export function deactivate() {}

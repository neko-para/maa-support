import { MaaFrameworkDebugSession } from '@maa/debugger/src/session'
import * as vscode from 'vscode'

import { NotebookController } from './notebook/controller'
import { NotebookSerializer } from './notebook/serializer'
import { GeneralPipelineLanguageSupport } from './pipeline/language'
import { MaaFrameworkPipelineSpec } from './pipeline/spec/fw'
import { MaaWpfPipelineSpec } from './pipeline/spec/wpf'

class InlineDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {
  createDebugAdapterDescriptor(_session: vscode.DebugSession): vscode.DebugAdapterDescriptor {
    return new vscode.DebugAdapterInlineImplementation(new MaaFrameworkDebugSession())
  }
}

export function activate(context: vscode.ExtensionContext) {
  const fwPipelineLSP = new GeneralPipelineLanguageSupport(MaaFrameworkPipelineSpec)
  const fwPipelineSelector: vscode.DocumentSelector = [
    {
      scheme: 'file',
      language: 'json',
      pattern: '**/pipeline/**/*.json'
    },
    {
      scheme: 'file',
      language: 'jsonc',
      pattern: '**/pipeline/**/*.json'
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

  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory('maafw', new InlineDebugAdapterFactory())
  )

  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer('maafw-notebook', new NotebookSerializer()),
    new NotebookController()._controller
  )
}

export function deactivate() {}

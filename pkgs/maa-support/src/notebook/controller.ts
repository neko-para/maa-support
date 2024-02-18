import * as maa from '@maa/maa'
import * as ts from 'typescript'
import * as vscode from 'vscode'

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

export class NotebookController {
  _controller

  _order = 0
  _contexts = {} as Record<string, unknown>

  constructor() {
    this._controller = vscode.notebooks.createNotebookController(
      'maafw-notebook-controller',
      'maafw-notebook',
      'Maa Framework Notebook'
    )

    this._controller.supportedLanguages = ['javascript', 'typescript']
    this._controller.supportsExecutionOrder = true
    this._controller.executeHandler = async (cells, notebook, controller) => {
      for (const cell of cells) {
        await this.runCell(cell)
      }
    }
  }

  async runCell(cell: vscode.NotebookCell) {
    const ctx = this._contexts[cell.document.uri.path] ?? {}
    this._contexts[cell.document.uri.path] = ctx
    const exec = this._controller.createNotebookCellExecution(cell)
    exec.executionOrder = ++this._order
    exec.start(Date.now())
    try {
      const code = cell.document.getText()
      const compiled = ts.transpile(code, {
        lib: ['es2023'],
        module: ts.ModuleKind.None,
        target: ts.ScriptTarget.ES2022,

        strict: true,
        esModuleInterop: true,
        skipLibCheck: true
      })

      const result: string[] = []
      const func = new AsyncFunction('maa', 'context', `with (maa) { ${compiled} }`)
      await func(
        {
          print: (text: string) => {
            result.push(text)
          },
          fail: (err: Error | string) => {
            if (typeof err === 'string') {
              err = new Error(err)
            }
            throw err
          },
          api: maa
        },
        ctx
      )
      const item = vscode.NotebookCellOutputItem.text(result.join('\n'), 'text/plain')
      exec.replaceOutput(new vscode.NotebookCellOutput([item]))
      exec.end(true, Date.now())
    } catch (err: unknown) {
      const item = vscode.NotebookCellOutputItem.error(err as Error)
      exec.replaceOutput(new vscode.NotebookCellOutput([item]))
      exec.end(false, Date.now())
    }
  }
}

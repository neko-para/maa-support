import * as vscode from 'vscode'

export class NotebookSerializer implements vscode.NotebookSerializer {
  deserializeNotebook(
    content: Uint8Array,
    token: vscode.CancellationToken
  ): vscode.NotebookData | Thenable<vscode.NotebookData> {
    const cells: vscode.NotebookCellData[] = []
    const metas: Record<string, unknown> = {}
    try {
      const data = JSON.parse(content.toString()) as vscode.NotebookData
      cells.push(...data.cells)
      Object.assign(metas, data.metadata ?? {})
    } catch (_) {}
    const data = new vscode.NotebookData(cells)
    data.metadata = metas
    return data
  }

  serializeNotebook(
    data: vscode.NotebookData,
    token: vscode.CancellationToken
  ): Uint8Array | Thenable<Uint8Array> {
    return Buffer.from(
      JSON.stringify(
        {
          cells: data.cells.map(cell => {
            if (cell.outputs) {
              delete cell.outputs
            }
            return cell
          }),
          metadata: data.metadata ?? {}
        },
        null,
        2
      ),
      'utf-8'
    )
  }
}

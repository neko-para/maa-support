type TaskNode = {
  name: string
  parent?: TaskNode // upper chain
  call?: TaskNode[]
  jump?: TaskNode
}

function dumpNode(node: TaskNode): string {
  return (
    `[${node.name}]` +
    (node.call ?? []).map(n => ` (-> ${dumpNode(n)})`).join('') +
    (node.jump ? ` => ${dumpNode(node.jump)}` : '')
  )
}

export class TaskMap {
  root?: TaskNode
  current?: TaskNode

  push(name: string, is_sub: boolean) {
    if (!this.root) {
      this.root = {
        name
      }
      this.current = this.root
    } else {
      if (!this.current) {
        throw 'fatal error!'
      }
      if (is_sub) {
        const next: TaskNode = {
          name,
          parent: this.current
        }
        this.current.call = this.current.call ?? []
        this.current.call.push(next)
        this.current = next
      } else {
        const next: TaskNode = {
          name,
          parent: this.current.parent
        }
        this.current.jump = next
        this.current = next
      }
    }
  }

  done() {
    if (this.current?.parent) {
      this.current = this.current.parent
    } else {
      throw 'fatal error!'
    }
  }

  dump() {
    return this.root ? dumpNode(this.root) : '<empty>'
  }
}

import * as Net from 'net'

import { MaaFrameworkDebugSession } from './session'

let port = 0
const args = process.argv.slice(2)
for (const arg of args) {
  const portMatch = /^--server=(\d{4,5})$/.exec(arg)
  if (portMatch) {
    port = parseInt(portMatch[1], 10)
  }
}

if (port > 0) {
  console.error(`waiting for debug protocol on port ${port}`)
  Net.createServer(socket => {
    console.error('>> accepted connection from client')
    socket.on('end', () => {
      console.error('>> client connection closed\n')
    })
    const session = new MaaFrameworkDebugSession()
    session.setRunAsServer(true)
    session.start(socket, socket)
  }).listen(port)
} else {
  const session = new MaaFrameworkDebugSession()
  process.on('SIGTERM', () => {
    session.shutdown()
  })
  session.start(process.stdin, process.stdout)
}

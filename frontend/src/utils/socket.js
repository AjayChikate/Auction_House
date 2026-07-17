import { io } from 'socket.io-client'

let socket = null
let socketToken = null 


export function connectSocket() {
  const token = localStorage.getItem('token')

  if (socket && socketToken === token) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  socketToken = token
  socket = io(import.meta.env.VITE_API_BASE, {
    auth: { token },
    transports: ['websocket'],
  })
  return socket
}



export function disconnectSocket() {
  if (socket) socket.disconnect()
  socket = null
  socketToken = null
}

export default { connectSocket, disconnectSocket }

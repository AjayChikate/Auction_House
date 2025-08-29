import { io } from 'socket.io-client'

let socket = null
export function connectSocket(){
  if (socket) return socket
  const token = localStorage.getItem('token')
  socket = io(import.meta.env.VITE_API_BASE, { auth: { token } })
  return socket
}

export function disconnectSocket(){
  if (socket) socket.disconnect()
  socket = null
}

export default { connectSocket, disconnectSocket }
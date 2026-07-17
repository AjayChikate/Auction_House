import React, { createContext, useContext, useEffect, useState } from 'react'
import { disconnectSocket } from '../utils/socket'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('me') || 'null')
    } catch {
      return null
    }
  })

  const login = (token, userObj) => {
    localStorage.setItem('token', token)
    localStorage.setItem('me', JSON.stringify(userObj))
    setUser(userObj)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('me')
    disconnectSocket()
    setUser(null)
  }

  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

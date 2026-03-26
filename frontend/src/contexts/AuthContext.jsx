import { createContext, useContext, useState, useCallback } from 'react'
import { login as neo4jLogin, logout as neo4jLogout, getAuthDriver } from '../services/neo4j.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (username, password) => {
    setLoading(true)
    try {
      const result = await neo4jLogin(username, password)
      setUser(result)
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    neo4jLogout()
    setUser(null)
  }, [])

  const isAuthenticated = !!user
  const isNetzplaner = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated, isNetzplaner }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

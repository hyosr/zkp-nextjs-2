'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AuthState {
  token: string | null
  username: string | null
  isAuthenticated: boolean
  login: (token: string, username: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  token: null,
  username: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('zkp_token')
    const u = localStorage.getItem('zkp_username')
    if (t && u) {
      setToken(t)
      setUsername(u)
    }
  }, [])

  const login = (t: string, u: string) => {
    localStorage.setItem('zkp_token', t)
    localStorage.setItem('zkp_username', u)
    setToken(t)
    setUsername(u)
  }

  const logout = () => {
    localStorage.removeItem('zkp_token')
    localStorage.removeItem('zkp_username')
    setToken(null)
    setUsername(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ token, username, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

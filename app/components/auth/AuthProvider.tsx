'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  preferences: {
    calendarType: 'google' | 'ical' | 'none' | null
    serviceSource: 'shopify' | 'csv' | 'manual' | null
    serviceConfig: any
  }
}

interface AuthContextType {
  user: User | null
  sessionId: string | null
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Vérifier la session au chargement
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const storedSessionId = localStorage.getItem('sessionId')
      if (!storedSessionId) {
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/session', {
        headers: {
          'x-session-id': storedSessionId
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setSessionId(storedSessionId)
      } else {
        localStorage.removeItem('sessionId')
        setSessionId(null)
        setUser(null)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de session:', error)
      localStorage.removeItem('sessionId')
      setSessionId(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création du compte')
    }

    setUser(data.user)
    setSessionId(data.sessionId)
    localStorage.setItem('sessionId', data.sessionId)
  }

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la connexion')
    }

    setUser(data.user)
    setSessionId(data.sessionId)
    localStorage.setItem('sessionId', data.sessionId)
  }

  const signOut = () => {
    setUser(null)
    setSessionId(null)
    localStorage.removeItem('sessionId')
  }

  const updatePreferences = async (preferences: Partial<User['preferences']>) => {
    if (!sessionId) {
      throw new Error('Non connecté')
    }

    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      },
      body: JSON.stringify({ preferences })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la mise à jour des préférences')
    }

    setUser(prev => prev ? { ...prev, preferences: data.preferences } : null)
  }

  const value = {
    user,
    sessionId,
    isLoading,
    signUp,
    signIn,
    signOut,
    updatePreferences
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

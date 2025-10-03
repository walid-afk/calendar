'use client'

import { useState } from 'react'
import { Card, TextField, Button, Text as PolarisText, Banner } from '@shopify/polaris'

interface SignInFormProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: () => void
  isDarkMode?: boolean
}

export function SignInForm({ onSignIn, onSignUp, isDarkMode = false }: SignInFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    
    if (!email || !password) {
      setError('Email et mot de passe requis')
      return
    }

    setLoading(true)
    try {
      await onSignIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <PolarisText as="h2" variant="headingLg">
            Se connecter
          </PolarisText>
          <PolarisText as="p" variant="bodyMd">
            Connectez-vous à votre compte
          </PolarisText>
        </div>

        {error && (
          <Banner tone="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            label="Adresse email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="votre@email.com"
            autoComplete="email"
          />
          
          <TextField
            label="Mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Votre mot de passe"
            autoComplete="current-password"
          />
          
          <Button
            variant="primary"
            size="large"
            onClick={handleSubmit}
            loading={loading}
            fullWidth
          >
            Se connecter
          </Button>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <PolarisText as="p" variant="bodyMd">
              Pas de compte ?{' '}
              <Button
                variant="plain"
                onClick={onSignUp}
                size="slim"
              >
                Créer un compte
              </Button>
            </PolarisText>
          </div>
        </div>
      </div>
    </Card>
  )
}

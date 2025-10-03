'use client'

import { useState } from 'react'
import { Card, TextField, Button, Text as PolarisText, Banner } from '@shopify/polaris'

interface SignUpFormProps {
  onSignUp: (email: string, password: string) => Promise<void>
  onSignIn: () => void
  isDarkMode?: boolean
}

export function SignUpForm({ onSignUp, onSignIn, isDarkMode = false }: SignUpFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setError(null)
    
    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Tous les champs sont requis')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    
    if (!email.includes('@')) {
      setError('Adresse email invalide')
      return
    }

    setLoading(true)
    try {
      await onSignUp(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <PolarisText as="h2" variant="headingLg">
            Créer un compte
          </PolarisText>
          <PolarisText as="p" variant="bodyMd">
            Commencez par créer votre compte pour accéder à l'application
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
            placeholder="Minimum 6 caractères"
            autoComplete="new-password"
          />
          
          <TextField
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Répétez votre mot de passe"
            autoComplete="new-password"
          />
          
          <Button
            variant="primary"
            size="large"
            onClick={handleSubmit}
            loading={loading}
            fullWidth
          >
            Créer le compte
          </Button>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <PolarisText as="p" variant="bodyMd">
              Déjà un compte ?{' '}
              <Button
                variant="plain"
                onClick={onSignIn}
                size="slim"
              >
                Se connecter
              </Button>
            </PolarisText>
          </div>
        </div>
      </div>
    </Card>
  )
}

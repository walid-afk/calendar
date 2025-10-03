'use client'

import { useState, useEffect } from 'react'
import { Card, Text as PolarisText, Button, Banner } from '@shopify/polaris'
import { SignUpForm } from '../auth/SignUpForm'
import { SignInForm } from '../auth/SignInForm'
import { CalendarTypeSelector } from './CalendarTypeSelector'
import { ServiceSourceSelector } from './ServiceSourceSelector'
import { useAuth } from '../auth/AuthProvider'

type SetupStep = 'auth' | 'signin' | 'signup' | 'calendar' | 'services' | 'complete'

interface SetupWizardProps {
  isDarkMode?: boolean
}

export function SetupWizard({ isDarkMode = false }: SetupWizardProps) {
  const { user, updatePreferences, signIn, signUp } = useAuth()
  const [currentStep, setCurrentStep] = useState<SetupStep>('auth')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  // Si l'utilisateur est connecté, vérifier les étapes complétées
  useEffect(() => {
    if (user) {
      if (!user.preferences.calendarType) {
        setCurrentStep('calendar')
      } else if (!user.preferences.serviceSource) {
        setCurrentStep('services')
      } else {
        setCurrentStep('complete')
      }
    }
  }, [user])

  const handleAuthModeChange = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    setCurrentStep(mode)
  }

  const handleCalendarTypeSelect = async (type: 'google' | 'ical' | 'none') => {
    try {
      await updatePreferences({ calendarType: type })
      setCurrentStep('services')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du type de calendrier:', error)
    }
  }

  const handleServiceSourceSelect = async (source: 'shopify' | 'csv' | 'manual', config?: any) => {
    try {
      await updatePreferences({ 
        serviceSource: source,
        serviceConfig: config
      })
      setCurrentStep('complete')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la source de services:', error)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'auth':
        return (
          <Card>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <PolarisText as="h2" variant="headingLg">
                Bienvenue
              </PolarisText>
              <div style={{ marginBottom: '24px' }}>
                <PolarisText as="p" variant="bodyMd">
                  Connectez-vous ou créez un compte pour commencer
                </PolarisText>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => handleAuthModeChange('signin')}
                  fullWidth
                >
                  Se connecter
                </Button>
                
                <Button
                  variant="secondary"
                  size="large"
                  onClick={() => handleAuthModeChange('signup')}
                  fullWidth
                >
                  Créer un compte
                </Button>
              </div>
            </div>
          </Card>
        )

      case 'signin':
        return (
          <SignInForm
            onSignIn={signIn}
            onSignUp={() => setCurrentStep('signup')}
            isDarkMode={isDarkMode}
          />
        )

      case 'signup':
        return (
          <SignUpForm
            onSignUp={signUp}
            onSignIn={() => setCurrentStep('signin')}
            isDarkMode={isDarkMode}
          />
        )

      case 'calendar':
        return (
          <CalendarTypeSelector
            onSelect={handleCalendarTypeSelect}
            isDarkMode={isDarkMode}
          />
        )

      case 'services':
        return (
          <ServiceSourceSelector
            onSelect={handleServiceSourceSelect}
            isDarkMode={isDarkMode}
          />
        )

      case 'complete':
        return (
          <Card>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <PolarisText as="h2" variant="headingLg">
                Configuration terminée
              </PolarisText>
              <div style={{ marginBottom: '24px' }}>
                <PolarisText as="p" variant="bodyMd">
                  Votre compte est maintenant configuré. Vous pouvez commencer à utiliser l'application.
                </PolarisText>
              </div>
              
              <Banner tone="success">
                <PolarisText as="p">
                  Calendrier: {user?.preferences.calendarType === 'google' ? 'Google Calendar' : 
                              user?.preferences.calendarType === 'ical' ? 'iCal' : 'Aucun'}
                </PolarisText>
                <PolarisText as="p">
                  Services: {user?.preferences.serviceSource === 'shopify' ? 'Shopify' : 
                            user?.preferences.serviceSource === 'csv' ? 'CSV' : 'Manuel'}
                </PolarisText>
              </Banner>
              
              <div style={{ marginTop: '16px' }}>
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => window.location.reload()}
                  fullWidth
                >
                  Commencer
                </Button>
              </div>
            </div>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {renderStep()}
      </div>
    </div>
  )
}

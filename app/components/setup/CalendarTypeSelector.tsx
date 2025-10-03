'use client'

import { useState } from 'react'
import { Card, Button, Text as PolarisText, Banner } from '@shopify/polaris'

interface CalendarTypeSelectorProps {
  onSelect: (type: 'google' | 'ical' | 'none') => void
  isDarkMode?: boolean
}

export function CalendarTypeSelector({ onSelect, isDarkMode = false }: CalendarTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<'google' | 'ical' | 'none' | null>(null)

  const handleSelect = (type: 'google' | 'ical' | 'none') => {
    setSelectedType(type)
  }

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType)
    }
  }

  return (
    <Card>
      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <PolarisText as="h2" variant="headingLg">
            Type d'agenda
          </PolarisText>
          <PolarisText as="p" variant="bodyMd">
            Choisissez comment vous voulez gérer votre calendrier
          </PolarisText>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <Button
            variant={selectedType === 'google' ? 'primary' : 'secondary'}
            size="large"
            onClick={() => handleSelect('google')}
            fullWidth
            icon={() => (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
          >
            Google Calendar (Recommandé)
          </Button>
          
          <Button
            variant={selectedType === 'ical' ? 'primary' : 'secondary'}
            size="large"
            onClick={() => handleSelect('ical')}
            fullWidth
            icon={() => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            )}
          >
            Calendrier iCal
          </Button>
          
          <Button
            variant={selectedType === 'none' ? 'primary' : 'secondary'}
            size="large"
            onClick={() => handleSelect('none')}
            fullWidth
            icon={() => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            )}
          >
            Pas de calendrier
          </Button>
        </div>

        {selectedType && (
          <div style={{ marginBottom: '16px' }}>
            <Banner tone="info">
              {selectedType === 'google' && 'Vous pourrez connecter votre compte Google Calendar pour synchroniser vos rendez-vous.'}
              {selectedType === 'ical' && 'Vous pourrez importer un fichier iCal pour afficher vos créneaux occupés.'}
              {selectedType === 'none' && 'Vous utiliserez l\'application sans synchronisation de calendrier externe.'}
            </Banner>
          </div>
        )}

        <Button
          variant="primary"
          size="large"
          onClick={handleContinue}
          disabled={!selectedType}
          fullWidth
        >
          Continuer
        </Button>
      </div>
    </Card>
  )
}

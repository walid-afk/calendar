'use client'

import { useState, useCallback } from 'react'
import { Modal, Button, Banner, Text } from '@shopify/polaris'
import dayjs from 'dayjs'
import { TimeUtils } from '@/app/lib/TimeUtils'

interface Service {
  title: string
  variantId: string
  durationMin: number
}

interface ValidatedBlock {
  title: string
  services: Service[]
  durationMin: number
}

interface BusySegment {
  start: string
  end: string
}

interface PinPadSchedulerProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (startTime: string, endTime: string) => void
  validatedBlock: ValidatedBlock
  date: string
  busySegments: BusySegment[]
}

export default function PinPadScheduler({
  isOpen,
  onClose,
  onConfirm,
  validatedBlock,
  date,
  busySegments
}: PinPadSchedulerProps) {
  const [timeInput, setTimeInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Snap à l'intervalle de 15 minutes
  const snapToQuarterHour = (minutes: number): number => {
    return Math.round(minutes / 15) * 15
  }

  // Validation de l'heure
  const validateTime = useCallback((timeStr: string): { isValid: boolean; error?: string; snappedTime?: string } => {
    if (timeStr.length !== 4) {
      return { isValid: false, error: 'Format invalide' }
    }

    const hours = parseInt(timeStr.substring(0, 2))
    const minutes = parseInt(timeStr.substring(2, 4))

    if (isNaN(hours) || isNaN(minutes)) {
      return { isValid: false, error: 'Format invalide' }
    }

    if (hours < 0 || hours > 23) {
      return { isValid: false, error: 'Heure invalide (00-23)' }
    }

    if (minutes < 0 || minutes > 59) {
      return { isValid: false, error: 'Minutes invalides (00-59)' }
    }

    // Snap aux 15 minutes
    const snappedMinutes = snapToQuarterHour(minutes)
    const snappedTime = `${String(hours).padStart(2, '0')}:${String(snappedMinutes).padStart(2, '0')}`

    return { isValid: true, snappedTime }
  }, [])

  // Vérification des conflits
  const checkConflicts = useCallback((startTime: string, endTime: string): boolean => {
    const start = dayjs(`${date}T${startTime}:00`)
    const end = dayjs(`${date}T${endTime}:00`)

    // Vérifier les horaires d'ouverture (8h-20h)
    if (start.hour() < 8 || end.hour() >= 20) {
      return true
    }

    // Vérifier les conflits avec les segments occupés
    return busySegments.some(segment => {
      const segmentStart = dayjs(segment.start)
      const segmentEnd = dayjs(segment.end)
      return start.isBefore(segmentEnd) && end.isAfter(segmentStart)
    })
  }, [date, busySegments])

  // Gestion des touches du clavier
  const handleKeyPress = useCallback((key: string) => {
    if (key === '<') {
      setTimeInput(prev => prev.slice(0, -1))
      setError(null)
    } else if (key === 'OK') {
      const validation = validateTime(timeInput)
      if (!validation.isValid) {
        setError(validation.error || 'Erreur de validation')
        return
      }

      const startTime = validation.snappedTime!
      const endTime = dayjs(`${date}T${startTime}:00`)
        .add(validatedBlock.durationMin, 'minutes')
        .format('HH:mm')

      if (checkConflicts(startTime, endTime)) {
        setError('Ce créneau n\'est pas disponible')
        return
      }

      onConfirm(startTime, endTime)
    } else if (key === ':') {
      // Ignorer les deux-points pour l'instant
      return
    } else if (key >= '0' && key <= '9' && timeInput.length < 4) {
      setTimeInput(prev => prev + key)
      setError(null)
    }
  }, [timeInput, validateTime, checkConflicts, date, validatedBlock.durationMin, onConfirm])

  // Formatage de l'affichage
  const formatDisplayTime = (input: string): string => {
    if (input.length === 0) return 'HH:MM'
    if (input.length <= 2) return `${input.padStart(2, '0')}:MM`
    return `${input.substring(0, 2)}:${input.substring(2, 4).padStart(2, '0')}`
  }

  // Réinitialisation
  const handleClose = () => {
    setTimeInput('')
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Choisir une heure"
      primaryAction={{
        content: 'Fermer',
        onAction: handleClose
      }}
    >
      <Modal.Section>
        <div className="space-y-6">
          {/* Informations du bloc */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Text variant="headingMd" as="h3">{validatedBlock.title}</Text>
            <Text variant="bodyMd" as="p">
              {TimeUtils.formatDuration(validatedBlock.durationMin)}
            </Text>
          </div>

          {/* Affichage de l'heure */}
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
              {formatDisplayTime(timeInput)}
            </div>
            <Text variant="bodyMd" as="p">
              {date} • Format 24h
            </Text>
          </div>

          {/* Message d'erreur */}
          {error && (
            <Banner tone="critical">
              <p>{error}</p>
            </Banner>
          )}

          {/* Clavier numérique */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['<', '0', 'OK']
            ].map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-3">
                {row.map((key) => (
                  <Button
                    key={key}
                    size="large"
                    onClick={() => handleKeyPress(key)}
                    variant={key === 'OK' ? 'primary' : 'secondary'}
                    disabled={key === ':'}
                  >
                    {key}
                  </Button>
                ))}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="text-center text-sm text-gray-600">
            <p>Entrez l'heure de début (HHMM)</p>
            <p>L'heure sera automatiquement arrondie aux 15 minutes</p>
          </div>
        </div>
      </Modal.Section>
    </Modal>
  )
}

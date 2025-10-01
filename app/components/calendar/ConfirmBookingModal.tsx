'use client'

import { useState } from 'react'
import { Modal, Button, Text, Card, Banner, Spinner } from '@shopify/polaris'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { TimeUtils } from '@/app/lib/TimeUtils'
import { DEFAULT_TZ } from '@/lib/time'

dayjs.extend(utc)
dayjs.extend(timezone)

interface Service {
  title: string
  variantId: string
  durationMin: number
}

interface Employee {
  id: string
  label: string
  calendarId: string
}

interface BookingData {
  start: string
  end: string
  services: Service[]
}

interface ConfirmBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  booking: BookingData
  employee?: Employee
  date: string
}

export default function ConfirmBookingModal({
  isOpen,
  onClose,
  onConfirm,
  booking,
  employee,
  date
}: ConfirmBookingModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  // Parse les dates ISO (UTC) et convertir en timezone local
  const startTime = dayjs(booking.start).tz(DEFAULT_TZ)
  const endTime = dayjs(booking.end).tz(DEFAULT_TZ)
  const duration = endTime.diff(startTime, 'minutes')
  const totalDuration = booking.services.reduce((sum, service) => sum + service.durationMin, 0)
  
  console.log('ConfirmBookingModal - Parsed times:', {
    bookingStart: booking.start,
    bookingEnd: booking.end,
    startTime: startTime.format('YYYY-MM-DD HH:mm:ss Z'),
    endTime: endTime.format('YYYY-MM-DD HH:mm:ss Z'),
    startTimeDisplay: startTime.format('HH:mm'),
    endTimeDisplay: endTime.format('HH:mm')
  })

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  const handleClose = () => {
    if (!isConfirming) {
      onClose()
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title="Confirmer la réservation"
      primaryAction={{
        content: isConfirming ? 'Réservation en cours...' : 'Confirmer la réservation',
        onAction: handleConfirm,
        disabled: isConfirming,
        loading: isConfirming
      }}
      secondaryActions={[
        {
          content: 'Annuler',
          onAction: handleClose,
          disabled: isConfirming
        }
      ]}
    >
      <Modal.Section>
        <div className="space-y-6">
          {/* Résumé de la réservation */}
          <Card>
            <div className="p-4">
              <Text as="h3" variant="headingMd" fontWeight="semibold">
                Résumé de la réservation
              </Text>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <Text as="span" variant="bodyMd">Date :</Text>
                  <Text as="span" variant="bodyMd" fontWeight="medium">
                    {startTime.format('dddd DD MMMM YYYY')}
                  </Text>
                </div>
                
                <div className="flex justify-between">
                  <Text as="span" variant="bodyMd">Horaires :</Text>
                  <Text as="span" variant="bodyMd" fontWeight="medium">
                    {startTime.format('HH:mm')} - {endTime.format('HH:mm')}
                  </Text>
                </div>
                
                <div className="flex justify-between">
                  <Text as="span" variant="bodyMd">Durée :</Text>
                  <Text as="span" variant="bodyMd" fontWeight="medium">
                    {TimeUtils.formatDuration(duration)}
                  </Text>
                </div>
                
                <div className="flex justify-between">
                  <Text as="span" variant="bodyMd">Employé :</Text>
                  <Text as="span" variant="bodyMd" fontWeight="medium">
                    {employee?.label || 'Non spécifié'}
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Services réservés */}
          <Card>
            <div className="p-4">
              <Text as="h3" variant="headingMd" fontWeight="semibold">
                Services ({booking.services.length})
              </Text>
              
              <div className="mt-4 space-y-2">
                {booking.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <Text as="span" variant="bodyMd" fontWeight="medium">
                        {service.title}
                      </Text>
                      <div className="text-sm text-gray-500">
                        ID: {service.variantId}
                      </div>
                    </div>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {TimeUtils.formatDuration(service.durationMin)}
                    </Text>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <Text as="span" variant="bodyLg" fontWeight="semibold">
                    Durée totale
                  </Text>
                  <Text as="span" variant="bodyLg" fontWeight="bold">
                    {TimeUtils.formatDuration(totalDuration)}
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Message d'information */}
          <Banner tone="info">
            <Text as="p" variant="bodyMd">
              La réservation sera créée dans le calendrier Google de {employee?.label || 'l\'employé sélectionné'} 
              et les créneaux seront marqués comme indisponibles.
            </Text>
          </Banner>
        </div>
      </Modal.Section>
    </Modal>
  )
}
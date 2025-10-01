'use client'

import { useState } from 'react'
import { Button, ButtonGroup, TextField, Text } from '@shopify/polaris'
import { useRouter } from 'next/navigation'
import { ConfirmOpenExternalModal } from '@/app/components/ConfirmOpenExternalModal'
import { openGoogleCalendar } from '@/lib/calendar-deeplink'
import { canCurrentUserManageSchedules } from '@/lib/permissions'
import { dayjs } from '@/lib/time'

interface ToolbarProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onPrevDay?: () => void
  onNextDay?: () => void
  onReload?: () => void
}

export function Toolbar({ selectedDate, onDateChange, onPrevDay, onNextDay, onReload }: ToolbarProps) {
  const router = useRouter()
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  const handlePrevDay = () => {
    if (onPrevDay) {
      onPrevDay()
    } else {
      const newDate = dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD')
      onDateChange(newDate)
    }
  }

  const handleNextDay = () => {
    if (onNextDay) {
      onNextDay()
    } else {
      const newDate = dayjs(selectedDate).add(1, 'day').format('YYYY-MM-DD')
      onDateChange(newDate)
    }
  }

  const handleToday = () => {
    const today = dayjs().format('YYYY-MM-DD')
    onDateChange(today)
  }

  // Formater la date pour l'affichage du bouton
  const formatDateForButton = (dateStr: string) => {
    const date = dayjs(dateStr)
    const today = dayjs()
    
    if (date.isSame(today, 'day')) {
      return 'Aujourd\'hui'
    } else if (date.isSame(today.add(1, 'day'), 'day')) {
      return 'Demain'
    } else if (date.isSame(today.subtract(1, 'day'), 'day')) {
      return 'Hier'
    } else {
      return date.format('DD/MM')
    }
  }

  const handleDateInputChange = (value: string) => {
    // Validate date format
    if (dayjs(value, 'YYYY-MM-DD', true).isValid()) {
      onDateChange(value)
    }
  }

  const handleOpenCalendar = () => {
    setShowCalendarModal(true)
  }

  const handleConfirmCalendar = () => {
    openGoogleCalendar()
  }

  const handleManageSchedule = () => {
    router.push('/employes/horaires')
  }

  const canManageSchedules = canCurrentUserManageSchedules()

  return (
    <>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid #e1e3e5'
      }}>
        {/* Left: Calendar button */}
        <div>
          <Button onClick={handleOpenCalendar}>
            📅 Calendar
          </Button>
        </div>

        {/* Center: Date navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ButtonGroup>
            <Button onClick={handlePrevDay}>‹</Button>
            <Button onClick={handleToday}>{formatDateForButton(selectedDate)}</Button>
            <Button onClick={handleNextDay}>›</Button>
          </ButtonGroup>
          
          <TextField
            label=""
            labelHidden
            value={selectedDate}
            onChange={handleDateInputChange}
            type="date"
            autoComplete="off"
          />

          {onReload && (
            <Button onClick={onReload} variant="secondary">
              🔄
            </Button>
          )}
        </div>

        {/* Right: Schedule management */}
        <div>
          {canManageSchedules && (
            <Button onClick={handleManageSchedule}>
              ⏰ Gestion horaire
            </Button>
          )}
        </div>
      </div>

      {/* Calendar confirmation modal */}
      <ConfirmOpenExternalModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onConfirm={handleConfirmCalendar}
        title="Ouvrir Google Calendar"
        message="Voulez-vous ouvrir Google Calendar dans une nouvelle fenêtre ou application ?"
      />
    </>
  )
}

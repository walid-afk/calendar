'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { dayjs, getOpeningMinutes, DEFAULT_OPENING } from '@/lib/time'
import { hasConflict, isBeforeLeadTime } from '@/lib/slots'
import { TimeAxis } from './TimeAxis'
import { StaffColumn } from './StaffColumn'
import { BusyBlocks } from './BusyBlocks'
import { CurrentTimeIndicator } from './CurrentTimeIndicator'
import type { Employee } from '@/types'

interface CartItem {
  id: number
  title: string
  price: string
  durationMinutes: number
}

interface Customer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
}

interface BookingDraft {
  staffId: string
  serviceId: string
  start: string
  end: string
  price: number
  customerId?: string
}

interface DayCalendarViewProps {
  employees: Employee[]
  selectedDate: string
  opening?: string // Prop pour les heures d'ouverture personnalisées
  onTimeSlotDrop: (employeeId: string, dateISO: string, hour: number, minute: number) => void // New prop
  currentDraft: { title: string; durationMin: number; price: number } | null // New prop
  pxPerMinute: number // New prop
  headerHeight: number // New prop
  busyEvents: Record<string, Array<{ start: string; end: string }>> // New prop
  zoomLevel?: '30min' | '15min' // New prop
  isDarkMode?: boolean
  isMobile?: boolean // New prop for mobile optimization
}

export function DayCalendarView({
  employees,
  selectedDate,
  opening = '09:00-19:00',
  onTimeSlotDrop,
  currentDraft,
  pxPerMinute,
  headerHeight,
  busyEvents,
  zoomLevel = '30min',
  isDarkMode = false,
  isMobile = false
}: DayCalendarViewProps) {
  // State
  const [loading, setLoading] = useState(false)

  // Calendar configuration
  const calendarOpening = opening
  const { open, close } = getOpeningMinutes(calendarOpening)
  const totalMinutes = close - open
  // Utiliser la hauteur calculée depuis le parent
  const calculatedHeight = totalMinutes * pxPerMinute

  // Time slot click handler
  const onTimeSlotSelect = (employeeId: string, dateISO: string, hour: number, minute: number) => {
    onTimeSlotDrop(employeeId, dateISO, hour, minute)
  }


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {pxPerMinute > 0 && (
          <div style={{ display: 'flex', height: calculatedHeight + headerHeight }}>
                {/* Time axis */}
                <TimeAxis 
                  pxPerMinute={pxPerMinute}
                  opening={calendarOpening}
                  containerHeight={calculatedHeight}
                  zoomLevel={zoomLevel}
                  isDarkMode={isDarkMode}
                  isMobile={isMobile}
                />

            {/* Staff columns */}
            <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
              {employees.map(employee => (
                <div key={employee.id} style={{ position: 'relative' }}>
                  <StaffColumn
                    employee={employee}
                    selectedDate={selectedDate}
                    opening={calendarOpening}
                    pxPerMinute={pxPerMinute}
                    busyEvents={busyEvents[employee.id] || []}
                    onTimeSlotSelect={onTimeSlotSelect}
                    zoomLevel={zoomLevel}
                    isDarkMode={isDarkMode}
                    isMobile={isMobile}
                  />
                  <BusyBlocks
                    busyEvents={busyEvents[employee.id] || []}
                    selectedDate={selectedDate}
                    opening={calendarOpening}
                    pxPerMinute={pxPerMinute}
                    employeeId={employee.id}
                    isDarkMode={isDarkMode}
                  />
                </div>
              ))}
              
              {/* Current time indicator - only show for today */}
              {dayjs(selectedDate).isSame(dayjs(), 'day') && (
                <CurrentTimeIndicator
                  opening={calendarOpening}
                  pxPerMinute={pxPerMinute}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

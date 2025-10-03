'use client'

import { useDroppable } from '@dnd-kit/core'
import { dayjs, getOpeningMinutes, DEFAULT_TZ } from '@/lib/time'
import type { Employee } from '@/types'

// Component for individual time slot droppable
function TimeSlotDroppable({ 
  id, 
  slotMinutes, 
  yPosition, 
  slotHeight, 
  isBusy, 
  eventTitle,
  onClick 
}: {
  id: string
  slotMinutes: number
  yPosition: number
  slotHeight: number
  isBusy: boolean
  eventTitle: string
  onClick: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{
        position: 'absolute',
        top: yPosition,
        left: 0,
        right: 0,
        height: slotHeight,
        backgroundColor: isOver 
          ? (isBusy ? '#fef2f2' : '#f0f9ff') 
          : (isBusy ? '#fef2f2' : 'transparent'),
        borderBottom: '1px solid #f3f4f6',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!isBusy && !isOver) {
          e.currentTarget.style.backgroundColor = '#f0f9ff'
        }
      }}
      onMouseLeave={(e) => {
        if (!isBusy && !isOver) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      {isBusy && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            color: '#dc2626',
            fontWeight: '500',
            textAlign: 'center',
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {eventTitle}
        </div>
      )}
    </div>
  )
}

interface StaffColumnProps {
  employee: Employee
  selectedDate: string
  opening: string
  pxPerMinute: number
  busyEvents: Array<{ start: string; end: string; title?: string; summary?: string }>
  onTimeSlotSelect: (employeeId: string, dateISO: string, hour: number, minute: number) => void
  zoomLevel?: '30min' | '15min'
  isDarkMode?: boolean
  isMobile?: boolean
}

export function StaffColumn({ 
  employee, 
  selectedDate, 
  opening, 
  pxPerMinute, 
  busyEvents,
  onTimeSlotSelect,
  zoomLevel = '30min',
  isDarkMode = false,
  isMobile = false
}: StaffColumnProps) {
  const { open, close } = getOpeningMinutes(opening)
  const totalMinutes = close - open
  const height = totalMinutes * pxPerMinute

  const handleTimeSlotClick = (hour: number, minute: number) => {
    onTimeSlotSelect(employee.id, selectedDate, hour, minute)
  }

  return (
    <div
        style={{
          position: 'relative',
          width: isMobile ? '100%' : '200px',
          height: height,
          borderRight: isDarkMode ? '1px solid #374151' : '1px solid #e1e3e5',
          backgroundColor: isDarkMode ? '#1f2937' : 'white'
        }}
    >

      {/* Time slots */}
      {Array.from({ length: Math.ceil(totalMinutes / (zoomLevel === '15min' ? 15 : 30)) }, (_, i) => {
        const slotInterval = zoomLevel === '15min' ? 15 : 30
        const slotMinutes = open + (i * slotInterval)
        const yPosition = (slotMinutes - open) * pxPerMinute
        const slotHeight = slotInterval * pxPerMinute

        // Debug: vérifier que slotMinutes est valide
        if (slotMinutes < 0 || slotMinutes > 1440) {
          console.error('Invalid slotMinutes:', { slotMinutes, open, i, slotInterval, totalMinutes })
        }

        // Check if this slot is busy and get the event title
        const busyEvent = busyEvents.find(event => {
          // Les événements viennent en UTC, les convertir en timezone local
          const eventStart = dayjs(event.start).tz(DEFAULT_TZ)
          const eventEnd = dayjs(event.end).tz(DEFAULT_TZ)
          const hour = Math.floor(slotMinutes / 60)
          const minute = slotMinutes % 60
          const slotStart = dayjs.tz(`${selectedDate}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`, DEFAULT_TZ)
          const slotEnd = slotStart.add(slotInterval, 'minute')

          return slotStart.isBefore(eventEnd) && slotEnd.isAfter(eventStart)
        })
        const isBusy = !!busyEvent
        const eventTitle = busyEvent?.title || busyEvent?.summary || 'Rendez-vous'

        // Utiliser l'heure et minute directement au lieu de slotMinutes
        const hour = Math.floor(slotMinutes / 60)
        const minute = slotMinutes % 60
        const dateWithoutDashes = selectedDate.replace(/-/g, '')
        // Encoder l'ID employé pour éviter les conflits avec les underscores
        const encodedEmployeeId = employee.id.replace(/_/g, 'UNDERSCORE')
        const timecellId = `timecell_${encodedEmployeeId}_${dateWithoutDashes}_${hour.toString().padStart(2, '0')}_${minute.toString().padStart(2, '0')}`
        
        return (
          <TimeSlotDroppable
            key={timecellId}
            id={timecellId}
            slotMinutes={slotMinutes}
            yPosition={yPosition}
            slotHeight={slotHeight}
            isBusy={isBusy}
            eventTitle={eventTitle}
            onClick={() => handleTimeSlotClick(hour, minute)}
          />
        )
      })}

      {/* Hour lines */}
      {Array.from({ length: Math.ceil(totalMinutes / 60) }, (_, i) => {
        const hourMinutes = open + (i * 60)
        const yPosition = (hourMinutes - open) * pxPerMinute
        
        return (
          <div
            key={hourMinutes}
                style={{
                  position: 'absolute',
                  top: yPosition,
                  left: 0,
                  right: 0,
                  height: '1px',
                  backgroundColor: isDarkMode ? '#374151' : '#e1e3e5'
                }}
          />
        )
      })}
    </div>
  )
}

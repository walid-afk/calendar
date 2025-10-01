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
  onTimeSlotSelect: (employeeId: string, dateISO: string, minuteOffset: number) => void
}

export function StaffColumn({ 
  employee, 
  selectedDate, 
  opening, 
  pxPerMinute, 
  busyEvents,
  onTimeSlotSelect 
}: StaffColumnProps) {
  const { open, close } = getOpeningMinutes(opening)
  const totalMinutes = close - open
  const height = totalMinutes * pxPerMinute

  const handleTimeSlotClick = (minuteOffset: number) => {
    onTimeSlotSelect(employee.id, selectedDate, minuteOffset)
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '200px',
        height: height,
        borderRight: '1px solid #e1e3e5',
        backgroundColor: 'white'
      }}
    >
      {/* Employee header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e1e3e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600',
          fontSize: '14px',
          color: '#374151',
          zIndex: 10
        }}
      >
        {employee.label}
      </div>

      {/* Time slots */}
      {Array.from({ length: Math.ceil(totalMinutes / 15) }, (_, i) => {
        const slotMinutes = open + (i * 15)
        const yPosition = (slotMinutes - open) * pxPerMinute
        const slotHeight = 15 * pxPerMinute

        // Check if this slot is busy and get the event title
        const busyEvent = busyEvents.find(event => {
          // Les événements viennent en UTC, les convertir en timezone local
          const eventStart = dayjs(event.start).tz(DEFAULT_TZ)
          const eventEnd = dayjs(event.end).tz(DEFAULT_TZ)
          const hour = Math.floor(slotMinutes / 60)
          const minute = slotMinutes % 60
          const slotStart = dayjs.tz(`${selectedDate}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`, DEFAULT_TZ)
          const slotEnd = slotStart.add(15, 'minute')

          return slotStart.isBefore(eventEnd) && slotEnd.isAfter(eventStart)
        })
        const isBusy = !!busyEvent
        const eventTitle = busyEvent?.title || busyEvent?.summary || 'Rendez-vous'

        const timecellId = `timecell_${employee.id}_${selectedDate}_${slotMinutes}`
        
        return (
          <TimeSlotDroppable
            key={timecellId}
            id={timecellId}
            slotMinutes={slotMinutes}
            yPosition={yPosition}
            slotHeight={slotHeight}
            isBusy={isBusy}
            eventTitle={eventTitle}
            onClick={() => handleTimeSlotClick(slotMinutes)}
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
              backgroundColor: '#e1e3e5'
            }}
          />
        )
      })}
    </div>
  )
}

'use client'

import { dayjs, getOpeningMinutes, DEFAULT_TZ } from '@/lib/time'

interface BusyBlock {
  start: string
  end: string
  title?: string
}

interface BusyBlocksProps {
  busyEvents: BusyBlock[]
  selectedDate: string
  opening: string
  pxPerMinute: number
  employeeId: string
  isDarkMode?: boolean
}

export function BusyBlocks({ 
  busyEvents, 
  selectedDate, 
  opening, 
  pxPerMinute, 
  employeeId,
  isDarkMode = false
}: BusyBlocksProps) {
  const { open, close } = getOpeningMinutes(opening)

  return (
    <>
      {busyEvents.map((event, index) => {
        // Les événements viennent en UTC, les convertir en timezone local
        const startTime = dayjs(event.start).tz(DEFAULT_TZ)
        const endTime = dayjs(event.end).tz(DEFAULT_TZ)
        
        console.log('BusyBlock rendering:', {
          eventStart: event.start,
          eventEnd: event.end,
          startLocal: startTime.format('HH:mm'),
          endLocal: endTime.format('HH:mm')
        })
        
        // Calculate position relative to opening time
        const startMinutes = startTime.hour() * 60 + startTime.minute()
        const endMinutes = endTime.hour() * 60 + endTime.minute()
        
        // Clamp les heures de début et fin aux heures d'ouverture
        const clampedStartMinutes = Math.max(startMinutes, open)
        const clampedEndMinutes = Math.min(endMinutes, close)
        
        // Vérifier si l'événement est visible dans la plage d'ouverture
        if (clampedStartMinutes >= close || clampedEndMinutes <= open) {
          return null // Ne pas afficher l'événement s'il est en dehors des heures d'ouverture
        }
        
        const top = (clampedStartMinutes - open) * pxPerMinute
        const height = (clampedEndMinutes - clampedStartMinutes) * pxPerMinute

        return (
          <div
            key={`${employeeId}-${index}`}
                style={{
                  position: 'absolute',
                  top: top,
                  left: '0',
                  right: '0',
                  height: height,
                  backgroundColor: isDarkMode ? '#7f1d1d' : '#fef2f2',
                  border: isDarkMode ? '1px solid #991b1b' : '1px solid #fecaca',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: isDarkMode ? '#fecaca' : '#dc2626',
                  fontWeight: '500',
                  zIndex: 5
                }}
          >
            {event.title || 'Occupé'}
          </div>
        )
      })}
    </>
  )
}

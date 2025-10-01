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
}

export function BusyBlocks({ 
  busyEvents, 
  selectedDate, 
  opening, 
  pxPerMinute, 
  employeeId 
}: BusyBlocksProps) {
  const { open } = getOpeningMinutes(opening)

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
        
        const top = (startMinutes - open) * pxPerMinute
        const height = (endMinutes - startMinutes) * pxPerMinute

        return (
          <div
            key={`${employeeId}-${index}`}
            style={{
              position: 'absolute',
              top: top,
              left: '0',
              right: '0',
              height: height,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#dc2626',
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

'use client'

import { dayjs, getOpeningMinutes } from '@/lib/time'

interface TimeAxisProps {
  pxPerMinute: number
  opening: string
  containerHeight: number
}

export function TimeAxis({ pxPerMinute, opening, containerHeight }: TimeAxisProps) {
  const { open, close } = getOpeningMinutes(opening)
  const totalMinutes = close - open
  const height = totalMinutes * pxPerMinute

  // Generate time labels every 30 minutes
  const timeLabels = []
  for (let minutes = open; minutes <= close; minutes += 30) {
    const hour = Math.floor(minutes / 60)
    const min = minutes % 60
    const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
    const yPosition = (minutes - open) * pxPerMinute
    
    timeLabels.push(
      <div
        key={minutes}
        style={{
          position: 'absolute',
          top: yPosition,
          left: 0,
          width: '60px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          color: '#6b7280',
          fontWeight: '500'
        }}
      >
        {timeString}
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '60px',
        height: height,
        borderRight: '1px solid #e1e3e5',
        backgroundColor: '#f9fafb'
      }}
    >
      {timeLabels}
      
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
      
      {/* 30-minute lines */}
      {Array.from({ length: Math.ceil(totalMinutes / 30) }, (_, i) => {
        const halfHourMinutes = open + (i * 30)
        if (halfHourMinutes % 60 === 0) return null // Skip hour lines
        
        const yPosition = (halfHourMinutes - open) * pxPerMinute
        
        return (
          <div
            key={halfHourMinutes}
            style={{
              position: 'absolute',
              top: yPosition,
              left: '40px',
              right: 0,
              height: '1px',
              backgroundColor: '#f3f4f6'
            }}
          />
        )
      })}
    </div>
  )
}

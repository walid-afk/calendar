'use client'

import { dayjs, getOpeningMinutes } from '@/lib/time'

interface TimeAxisProps {
  pxPerMinute: number
  opening: string
  containerHeight: number
  zoomLevel?: '30min' | '15min'
  isDarkMode?: boolean
  isMobile?: boolean
}

export function TimeAxis({ pxPerMinute, opening, containerHeight, zoomLevel = '30min', isDarkMode = false, isMobile = false }: TimeAxisProps) {
  const { open, close } = getOpeningMinutes(opening)
  const totalMinutes = close - open
  const height = totalMinutes * pxPerMinute

  // Generate time labels according to zoom level
  const timeLabels = []
  const labelInterval = zoomLevel === '15min' ? 15 : 30
  for (let minutes = open; minutes <= close; minutes += labelInterval) {
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
              width: isMobile ? '50px' : '60px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              fontSize: isMobile ? '11px' : '12px',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
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
            width: isMobile ? '50px' : '60px',
            height: height,
            borderRight: isDarkMode ? '1px solid #374151' : '1px solid #e1e3e5',
            backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb'
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
                  backgroundColor: isDarkMode ? '#374151' : '#e1e3e5'
                }}
          />
        )
      })}
      
      {/* Sub-hour lines according to zoom level */}
      {zoomLevel === '15min' ? (
        // 15-minute lines in 15min view
        Array.from({ length: Math.ceil(totalMinutes / 15) }, (_, i) => {
          const quarterHourMinutes = open + (i * 15)
          if (quarterHourMinutes % 60 === 0) return null // Skip hour lines
          if (quarterHourMinutes % 30 === 0) return null // Skip 30min lines
          
          const yPosition = (quarterHourMinutes - open) * pxPerMinute
          
          return (
            <div
              key={quarterHourMinutes}
              style={{
                position: 'absolute',
                top: yPosition,
                left: '40px',
                right: 0,
                height: '1px',
                    backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6'
              }}
            />
          )
        })
      ) : (
        // 30-minute lines in 30min view
        Array.from({ length: Math.ceil(totalMinutes / 30) }, (_, i) => {
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
                    backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6'
              }}
            />
          )
        })
      )}
    </div>
  )
}

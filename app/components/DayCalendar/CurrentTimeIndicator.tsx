'use client'

import { useState, useEffect } from 'react'
import { dayjs, getOpeningMinutes } from '@/lib/time'

interface CurrentTimeIndicatorProps {
  opening: string
  pxPerMinute: number
}

export function CurrentTimeIndicator({ opening, pxPerMinute }: CurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(dayjs())

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const { open, close } = getOpeningMinutes(opening)
  const currentMinutes = currentTime.hour() * 60 + currentTime.minute()

  // Only show if current time is within opening hours
  if (currentMinutes < open || currentMinutes > close) {
    return null
  }

  const top = (currentMinutes - open) * pxPerMinute

  return (
    <div
      style={{
        position: 'absolute',
        top: top,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: '#000000',
        zIndex: 20,
        pointerEvents: 'none'
      }}
    />
  )
}

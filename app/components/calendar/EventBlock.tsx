'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import { TimeUtils } from '@/app/lib/TimeUtils'

interface Event {
  id: string
  title: string
  start: string
  end: string
  customer?: {
    name: string
    email: string
  }
}

interface EventBlockProps {
  event: Event
  style?: React.CSSProperties
}

export default function EventBlock({ event, style }: EventBlockProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const startTime = dayjs(event.start).format('HH:mm')
  const endTime = dayjs(event.end).format('HH:mm')
  const duration = dayjs(event.end).diff(dayjs(event.start), 'minutes')

  return (
    <div
      className="absolute bg-orange-100 border border-orange-300 rounded-lg p-2 cursor-pointer transition-all duration-200 hover:shadow-md"
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Contenu principal */}
      <div className="h-full flex flex-col justify-between">
        {/* En-tête avec horaires */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium text-orange-800">
            {startTime} - {endTime}
          </div>
          <div className="text-xs text-orange-600">
            {TimeUtils.formatDuration(duration)}
          </div>
        </div>

        {/* Titre du rendez-vous */}
        <div className="text-sm font-semibold text-orange-900 mb-1 line-clamp-1">
          {event.title}
        </div>

        {/* Informations client */}
        {event.customer && (
          <div className="text-xs text-orange-700">
            {event.customer.name}
          </div>
        )}
      </div>

      {/* Tooltip au survol */}
      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 min-w-64">
          <div className="font-semibold mb-2">{event.title}</div>
          
          <div className="space-y-1">
            <div>
              <span className="text-gray-300">Horaires:</span> {startTime} - {endTime}
            </div>
            <div>
              <span className="text-gray-300">Durée:</span> {TimeUtils.formatDuration(duration)}
            </div>
            {event.customer && (
              <>
                <div>
                  <span className="text-gray-300">Client:</span> {event.customer.name}
                </div>
                <div>
                  <span className="text-gray-300">Email:</span> {event.customer.email}
                </div>
              </>
            )}
          </div>

          {/* Flèche du tooltip */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}
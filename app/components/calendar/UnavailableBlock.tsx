'use client'

import { useState } from 'react'
import dayjs from 'dayjs'
import { TimeUtils } from '@/app/lib/TimeUtils'

interface BusySegment {
  start: string
  end: string
}

interface UnavailableBlockProps {
  segment: BusySegment
  style?: React.CSSProperties
}

export default function UnavailableBlock({ segment, style }: UnavailableBlockProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const startTime = dayjs(segment.start).format('HH:mm')
  const endTime = dayjs(segment.end).format('HH:mm')
  const duration = dayjs(segment.end).diff(dayjs(segment.start), 'minutes')

  return (
    <div
      className="absolute bg-gray-800 border border-gray-600 rounded-lg p-2 cursor-not-allowed transition-all duration-200 hover:bg-gray-700"
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Contenu principal */}
      <div className="h-full flex flex-col justify-center">
        {/* En-tête avec horaires */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium text-gray-300">
            {startTime} - {endTime}
          </div>
          <div className="text-xs text-gray-400">
            {TimeUtils.formatDuration(duration)}
          </div>
        </div>

        {/* Titre */}
        <div className="text-sm font-semibold text-gray-200 text-center">
          Indisponible
        </div>
      </div>

      {/* Tooltip au survol */}
      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 min-w-64">
          <div className="font-semibold mb-2 text-red-300">Zone indisponible</div>
          
          <div className="space-y-1">
            <div>
              <span className="text-gray-300">Horaires:</span> {startTime} - {endTime}
            </div>
            <div>
              <span className="text-gray-300">Durée:</span> {TimeUtils.formatDuration(duration)}
            </div>
            <div className="text-gray-400 text-xs mt-2">
              Cette plage horaire est déjà réservée ou hors des heures d'ouverture.
            </div>
          </div>

          {/* Flèche du tooltip */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  )
}

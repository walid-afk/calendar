'use client'

import { useState, useRef, useEffect } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { TimeUtils } from '@/app/lib/TimeUtils'

interface Service {
  title: string
  variantId: string
  durationMin: number
}

interface ValidatedBlock {
  id: string
  title: string
  services: Service[]
  durationMin: number
}

interface CombinedCartBlockProps {
  block: ValidatedBlock
  onDragStart: () => void
  isDragging: boolean
}

export default function CombinedCartBlock({
  block,
  onDragStart,
  isDragging
}: CombinedCartBlockProps) {
  const [isHovered, setIsHovered] = useState(false)

  // dnd-kit draggable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDndDragging
  } = useDraggable({
    id: block.id,
    data: block
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        relative bg-white border-2 border-gray-300 text-gray-800 rounded-lg p-4 cursor-grab
        transition-all duration-200 hover:shadow-lg hover:border-blue-400
        ${isDndDragging ? 'opacity-50 scale-95 cursor-grabbing border-blue-500' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        userSelect: 'none',
        touchAction: 'none',
        backgroundColor: 'white',
        ...style
      }}
    >
      {/* Icône de drag */}
      <div className="absolute top-2 right-2 text-gray-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </div>

      {/* En-tête */}
      <div className="mb-3">
        <div className="text-lg font-bold text-gray-800">{block.title}</div>
        <div className="text-sm text-gray-600">
          {TimeUtils.formatDuration(block.durationMin)}
        </div>
      </div>

      {/* Liste des services (condensée) */}
      <div className="space-y-1 mb-3">
        {block.services.slice(0, 2).map((service, index) => (
          <div key={index} className="text-sm text-gray-700 truncate">
            • {service.title}
          </div>
        ))}
        {block.services.length > 2 && (
          <div className="text-xs text-gray-500">
            +{block.services.length - 2} autres...
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 text-center">
        {isDndDragging ? (
          <span className="flex items-center justify-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Glissez sur le calendrier
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
            Cliquez et glissez pour réserver
          </span>
        )}
      </div>

      {/* Tooltip détaillé au survol */}
      {isHovered && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50 min-w-64">
          <div className="font-semibold mb-2">Détails des prestations</div>
          
          <div className="space-y-1">
            {block.services.map((service, index) => (
              <div key={index} className="flex justify-between">
                <span>{service.title}</span>
                <span className="text-blue-300">{service.durationMin}min</span>
              </div>
            ))}
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>{TimeUtils.formatDuration(block.durationMin)}</span>
            </div>
          </div>

          {/* Flèche du tooltip */}
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}

      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-blue-100 to-transparent opacity-0 hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}
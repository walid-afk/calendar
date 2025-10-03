'use client'

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

interface CustomDragPreviewProps {
  block?: ValidatedBlock
  isVisible?: boolean
}

export default function CustomDragPreview({ block, isVisible = false }: CustomDragPreviewProps) {
  if (!isVisible || !block) {
    return null
  }

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-50"
    >
      <div
        className="bg-white border-2 border-blue-400 text-gray-800 rounded-lg p-4 shadow-xl opacity-90"
        style={{
          width: '280px',
          transform: 'translate(-50%, 0%)', // Centrer horizontalement, aligner le haut avec le curseur
        }}
      >
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
        <div className="text-xs text-blue-600 text-center">
          <span className="flex items-center justify-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Glissez sur le calendrier
          </span>
        </div>
      </div>
    </div>
  )
}
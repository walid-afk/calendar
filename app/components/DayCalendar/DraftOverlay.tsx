'use client'

import { DragOverlay } from '@dnd-kit/core'
import { dayjs, getOpeningMinutes } from '@/lib/time'

interface DraftOverlayProps {
  isDragging: boolean
  activeId: string | null
  draft: {
    title: string
    durationMin: number
    price?: number
  } | null
  opening: string
  pxPerMinute: number
}

export function DraftOverlay({ 
  isDragging, 
  activeId, 
  draft, 
  opening, 
  pxPerMinute 
}: DraftOverlayProps) {
  if (!isDragging || !activeId || !draft) {
    return null
  }

  const height = draft.durationMin * pxPerMinute

  return (
    <div
      style={{
        width: '200px',
        height: height,
        backgroundColor: 'white',
        color: 'black',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: '500',
        opacity: 0.95,
        transform: 'rotate(1deg)',
        border: '2px solid #e5e7eb'
      }}
    >
      <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
        {draft.title}
      </div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>
        {draft.durationMin} min
      </div>
      {draft.price && (
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          {draft.price}€
        </div>
      )}
    </div>
  )
}

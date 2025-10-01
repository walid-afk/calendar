'use client'

import React from 'react'
import { useDroppable } from '@dnd-kit/core'

interface DroppableProps {
  id: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Droppable({ id, children, className, style }: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  const droppableStyle = {
    opacity: isOver ? 1 : 0.5,
    ...style,
  }

  return (
    <div ref={setNodeRef} style={droppableStyle} className={className}>
      {children}
    </div>
  )
}

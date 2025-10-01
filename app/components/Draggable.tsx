'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface DraggableProps {
  id: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function Draggable({ id, children, className, style }: DraggableProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  })

  const draggableStyle = {
    transform: CSS.Translate.toString(transform),
    ...style,
  }

  return (
    <div
      ref={setNodeRef}
      style={draggableStyle}
      className={className}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  )
}

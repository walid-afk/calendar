'use client'

import { Card, Text, Badge, Button } from '@shopify/polaris'
import { useState } from 'react'
// Fonction locale pour formater l'heure
function formatCellTime(cell: any): string {
  const start = new Date(cell.start).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  })
  const end = new Date(cell.end).toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  })
  return `${start}–${end}`
}

interface Cell {
  start: string
  end: string
  idx: number
  busy: boolean
}

interface SlotsGridProps {
  cells: Cell[]
  validStarts: number[]
  need: number
  needWithBuffer: number
  step: number
  onSlotSelect: (start: string, end: string) => void
  selectedStart?: string
  selectedEnd?: string
}

export function SlotsGrid({
  cells = [],
  validStarts = [],
  need = 0,
  needWithBuffer = 0,
  step = 15,
  onSlotSelect,
  selectedStart,
  selectedEnd
}: SlotsGridProps) {
  const [hoveredStart, setHoveredStart] = useState<number | null>(null)

  const getCellStyle = (cell: Cell, idx: number) => {
    const isSelected = selectedStart === cell.start && selectedEnd === cell.end
    const isHovered = hoveredStart !== null && idx >= hoveredStart && idx < hoveredStart + need
    const isValidStart = validStarts.includes(idx)
    
    let backgroundColor = '#f6f6f7'
    let color = '#202223'
    let cursor = 'default'
    let border = '1px solid #e1e3e5'
    
    if (cell.busy) {
      backgroundColor = '#e1e3e5'
      color = '#8c9196'
    } else if (isSelected) {
      backgroundColor = '#008060'
      color = '#ffffff'
    } else if (isHovered) {
      backgroundColor = '#f0fdf4'
      border = '1px solid #008060'
    } else if (isValidStart) {
      backgroundColor = '#ffffff'
      cursor = 'pointer'
      border = '1px solid #008060'
    }

    return {
      width: '44px',
      height: '28px',
      backgroundColor,
      color,
      cursor,
      border,
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    }
  }

  const handleCellClick = (cell: Cell, idx: number) => {
    if (cell.busy || !validStarts.includes(idx) || !cells || cells.length === 0) return
    
    const endCell = cells[idx + need - 1]
    if (endCell) {
      onSlotSelect(cell.start, endCell.end)
    }
  }

  const handleCellHover = (idx: number) => {
    if (validStarts.includes(idx)) {
      setHoveredStart(idx)
    }
  }

  const handleCellLeave = () => {
    setHoveredStart(null)
  }

  if (!cells || cells.length === 0) {
    return (
      <Card>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Text as="p">Aucun créneau disponible</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Text as="h3" variant="headingMd">Créneaux disponibles</Text>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Badge tone="info">{`${need} créneaux`}</Badge>
            <Badge tone="success">{`${validStarts?.length || 0} disponibles`}</Badge>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(44px, 1fr))',
          gap: '4px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {Array.isArray(cells) && cells.map((cell, idx) => (
            <div
              key={idx}
              style={getCellStyle(cell, idx)}
              onClick={() => handleCellClick(cell, idx)}
              onMouseEnter={() => handleCellHover(idx)}
              onMouseLeave={handleCellLeave}
              title={formatCellTime(cell)}
            >
              {formatCellTime(cell).split('–')[0]}
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '16px', fontSize: '12px', color: '#6d7175', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#e1e3e5', borderRadius: '2px' }}></div>
            <Text as="span" variant="bodySm">Occupé</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#ffffff', border: '1px solid #008060', borderRadius: '2px' }}></div>
            <Text as="span" variant="bodySm">Disponible</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#008060', borderRadius: '2px' }}></div>
            <Text as="span" variant="bodySm">Sélectionné</Text>
          </div>
        </div>
      </div>
    </Card>
  )
}

'use client'

import { Badge, Button, Select, TextField } from '@shopify/polaris'
import { useState } from 'react'
import Link from 'next/link'

interface Employee {
  id: string
  label: string
}

interface TopBarProps {
  isGoogleConnected: boolean
  employees: Employee[]
  selectedEmployee: string
  onEmployeeChange: (employeeId: string) => void
  selectedDate: string
  onDateChange: (date: string) => void
  onGoogleAuth: () => void
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
}

export function TopBar({
  isGoogleConnected,
  employees,
  selectedEmployee,
  onEmployeeChange,
  selectedDate,
  onDateChange,
  onGoogleAuth,
  isDarkMode = false,
  onToggleDarkMode
}: TopBarProps) {
  const employeeOptions = employees.map(emp => ({
    label: emp.label,
    value: emp.id
  }))

  const googleStatus = isGoogleConnected ? (
    <Badge tone="success">Google Connecté</Badge>
  ) : (
    <Button onClick={onGoogleAuth} size="slim">
      Connecter Google
    </Button>
  )

  return (
    <div style={{ 
      backgroundColor: isDarkMode ? '#1f2937' : '#f6f6f7', 
      borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e1e3e5'}`,
      color: isDarkMode ? '#f9fafb' : '#111827'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', width: '100%', padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {googleStatus}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onToggleDarkMode && (
            <Button 
              size="slim" 
              variant="secondary"
              onClick={onToggleDarkMode}
              icon={() => (
                <span style={{ fontSize: '16px' }}>
                  {isDarkMode ? '☀️' : '🌙'}
                </span>
              )}
            >
              {isDarkMode ? 'Mode clair' : 'Mode sombre'}
            </Button>
          )}
          
          <Link href="/admin/calendar">
            <Button size="slim" variant="secondary">
              📅 Calendrier Admin
            </Button>
          </Link>
        </div>
        
      </div>
    </div>
  )
}

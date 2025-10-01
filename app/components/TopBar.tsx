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
}

export function TopBar({
  isGoogleConnected,
  employees,
  selectedEmployee,
  onEmployeeChange,
  selectedDate,
  onDateChange,
  onGoogleAuth
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
    <div style={{ backgroundColor: '#f6f6f7', borderBottom: '1px solid #e1e3e5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {googleStatus}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

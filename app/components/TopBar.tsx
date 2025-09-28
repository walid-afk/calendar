'use client'

import { TopBar as PolarisTopBar, Badge, Button, Select, TextField } from '@shopify/polaris'
import { useState } from 'react'

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
    <Badge status="success">Google Connecté</Badge>
  ) : (
    <Button onClick={onGoogleAuth} size="slim">
      Connecter Google
    </Button>
  )

  return (
    <PolarisTopBar>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {googleStatus}
        </div>
        
        <div style={{ minWidth: '200px' }}>
          <Select
            label="Employé"
            options={[
              { label: 'Sélectionner un employé', value: '' },
              ...employeeOptions
            ]}
            value={selectedEmployee}
            onChange={onEmployeeChange}
          />
        </div>
        
        <div style={{ minWidth: '150px' }}>
          <TextField
            label="Date"
            type="date"
            value={selectedDate}
            onChange={onDateChange}
          />
        </div>
      </div>
    </PolarisTopBar>
  )
}

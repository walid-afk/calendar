'use client'

import { Select } from '@shopify/polaris'

interface Employee {
  id: string
  label: string
}

interface EmployeeSelectProps {
  employees: Employee[]
  selectedEmployee: string
  onEmployeeChange: (employeeId: string) => void
  disabled?: boolean
}

export function EmployeeSelect({
  employees,
  selectedEmployee,
  onEmployeeChange,
  disabled = false
}: EmployeeSelectProps) {
  const options = [
    { label: 'Sélectionner un employé', value: '' },
    ...employees.map(emp => ({
      label: emp.label,
      value: emp.id
    }))
  ]

  return (
    <Select
      label="Employé"
      options={options}
      value={selectedEmployee}
      onChange={onEmployeeChange}
      disabled={disabled}
    />
  )
}

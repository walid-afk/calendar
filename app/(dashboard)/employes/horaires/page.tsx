'use client'

import { useState, useEffect } from 'react'
import { Page, Card, Layout, Button, Banner, TextField, Select, Checkbox } from '@shopify/polaris'
import { useRouter } from 'next/navigation'
import type { Employee } from '@/types'

interface DaySchedule {
  open: string
  close: string
  closed: boolean
  lunch?: {
    start: string
    end: string
  } | null
}

interface WeekSchedule {
  tz: string
  week: {
    mon: DaySchedule
    tue: DaySchedule
    wed: DaySchedule
    thu: DaySchedule
    fri: DaySchedule
    sat: DaySchedule
    sun: DaySchedule
  }
}

const DAYS = [
  { key: 'mon', label: 'Lundi' },
  { key: 'tue', label: 'Mardi' },
  { key: 'wed', label: 'Mercredi' },
  { key: 'thu', label: 'Jeudi' },
  { key: 'fri', label: 'Vendredi' },
  { key: 'sat', label: 'Samedi' },
  { key: 'sun', label: 'Dimanche' }
] as const

const DEFAULT_SCHEDULE: WeekSchedule = {
  tz: 'Europe/Paris',
  week: {
    mon: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    tue: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    wed: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    thu: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    fri: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    sat: { open: '09:00', close: '19:00', closed: false, lunch: null },
    sun: { open: '09:00', close: '19:00', closed: true, lunch: null }
  }
}

export default function EmployeeSchedulePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ content: string; isError?: boolean } | null>(null)

  // Chargement initial
  useEffect(() => {
    const savedPasscode = localStorage.getItem('passcode')
    if (savedPasscode) {
      setPasscode(savedPasscode)
      handleAuth(savedPasscode)
    }
  }, [])

  // Chargement des employés
  useEffect(() => {
    if (isAuthenticated && passcode) {
      loadEmployees()
    }
  }, [isAuthenticated, passcode])

  // Chargement du planning
  useEffect(() => {
    if (selectedEmployee && isAuthenticated) {
      loadSchedule()
    }
  }, [selectedEmployee, isAuthenticated])

  const handleAuth = async (code: string) => {
    if (code === '1234') {
      try {
        const response = await fetch('/api/auth/check', {
          headers: { 'x-passcode': code }
        })

        if (response.ok) {
          setIsAuthenticated(true)
          localStorage.setItem('passcode', code)
          setAuthError(null)
        } else {
          setAuthError('Code d\'accès invalide')
        }
      } catch (error) {
        setAuthError('Erreur de connexion')
      }
    } else {
      setAuthError('Code d\'accès invalide')
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/employees', {
        headers: { 'x-passcode': passcode }
      })

      if (response.ok) {
        const data = await response.json()
        setEmployees(data.items || [])
      } else {
        setToast({ content: 'Erreur lors du chargement des employés', isError: true })
      }
    } catch (error) {
      setToast({ content: 'Erreur de connexion', isError: true })
    }
  }

  const loadSchedule = async () => {
    if (!selectedEmployee) return

    setLoading(true)
    try {
      const response = await fetch(`/api/horaires/${selectedEmployee}`, {
        headers: { 'x-passcode': passcode }
      })

      if (response.ok) {
        const data = await response.json()
        setSchedule(data)
      } else if (response.status === 404) {
        // Pas de planning défini, utiliser les valeurs par défaut
        setSchedule(DEFAULT_SCHEDULE)
      } else {
        setToast({ content: 'Erreur lors du chargement du planning', isError: true })
      }
    } catch (error) {
      setToast({ content: 'Erreur de connexion', isError: true })
    } finally {
      setLoading(false)
    }
  }

  const saveSchedule = async () => {
    if (!selectedEmployee) return

    setSaving(true)
    try {
      const response = await fetch(`/api/horaires/${selectedEmployee}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-passcode': passcode
        },
        body: JSON.stringify(schedule)
      })

      if (response.ok) {
        setToast({ content: 'Planning enregistré avec succès', isError: false })
      } else {
        setToast({ content: 'Erreur lors de l\'enregistrement', isError: true })
      }
    } catch (error) {
      setToast({ content: 'Erreur de connexion', isError: true })
    } finally {
      setSaving(false)
    }
  }

  const updateDaySchedule = (day: keyof WeekSchedule['week'], field: keyof DaySchedule, value: any) => {
    setSchedule(prev => ({
      ...prev,
      week: {
        ...prev.week,
        [day]: {
          ...prev.week[day],
          [field]: value
        }
      }
    }))
  }

  const updateLunchSchedule = (day: keyof WeekSchedule['week'], field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      week: {
        ...prev.week,
        [day]: {
          ...prev.week[day],
          lunch: {
            ...prev.week[day].lunch,
            [field]: value
          }
        }
      }
    }))
  }

  const toggleLunch = (day: keyof WeekSchedule['week']) => {
    setSchedule(prev => ({
      ...prev,
      week: {
        ...prev.week,
        [day]: {
          ...prev.week[day],
          lunch: prev.week[day].lunch ? null : { start: '12:30', end: '13:30' }
        }
      }
    }))
  }

  // Interface de connexion
  if (!isAuthenticated) {
    return (
      <Page title="Gestion des horaires">
        <Card>
          <div className="passcode-form">
            <div style={{ marginBottom: '16px' }}>
              <input
                type="password"
                placeholder="Entrez votre code d'accès"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth(passcode)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            {authError && (
              <Banner tone="critical">{authError}</Banner>
            )}
            <div>
              <button
                onClick={() => handleAuth(passcode)}
                disabled={!passcode.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#008060',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Se connecter
              </button>
            </div>
          </div>
        </Card>
      </Page>
    )
  }

  return (
    <Page
      title="Gestion des horaires"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Sélection employé */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                    Employé
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '16px'
                    }}
                  >
                    <option value="">Sélectionner un employé</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Planning par jour */}
                {selectedEmployee && !loading && (
                  <div>
                    <h3 style={{ marginBottom: '16px' }}>Planning hebdomadaire</h3>
                    {DAYS.map(day => {
                      const daySchedule = schedule.week[day.key]
                      return (
                        <div
                          key={day.key}
                          style={{
                            border: '1px solid #e1e3e5',
                            borderRadius: '8px',
                            padding: '16px',
                            marginBottom: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <h4 style={{ margin: 0, flex: 1 }}>{day.label}</h4>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={daySchedule.closed}
                                onChange={(e) => updateDaySchedule(day.key, 'closed', e.target.checked)}
                              />
                              Fermé
                            </label>
                          </div>

                          {!daySchedule.closed && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                                  Ouverture
                                </label>
                                <input
                                  type="time"
                                  value={daySchedule.open}
                                  onChange={(e) => updateDaySchedule(day.key, 'open', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                                  Fermeture
                                </label>
                                <input
                                  type="time"
                                  value={daySchedule.close}
                                  onChange={(e) => updateDaySchedule(day.key, 'close', e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px'
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {!daySchedule.closed && (
                            <div style={{ marginTop: '12px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={!!daySchedule.lunch}
                                  onChange={() => toggleLunch(day.key)}
                                />
                                Pause déjeuner
                              </label>

                              {daySchedule.lunch && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                  <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                                      Début
                                    </label>
                                    <input
                                      type="time"
                                      value={daySchedule.lunch.start}
                                      onChange={(e) => updateLunchSchedule(day.key, 'start', e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                                      Fin
                                    </label>
                                    <input
                                      type="time"
                                      value={daySchedule.lunch.end}
                                      onChange={(e) => updateLunchSchedule(day.key, 'end', e.target.value)}
                                      style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px'
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Boutons d'action */}
                {selectedEmployee && (
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => router.push('/employes/jour')}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={saveSchedule}
                      disabled={saving}
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#008060',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        opacity: saving ? 0.6 : 1
                      }}
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            backgroundColor: toast.isError ? '#d72c0d' : '#008060',
            color: 'white',
            borderRadius: '4px',
            zIndex: 1000
          }}
        >
          {toast.content}
        </div>
      )}
    </Page>
  )
}

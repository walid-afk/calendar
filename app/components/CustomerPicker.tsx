'use client'

import { Card, TextField, Button, Modal, List, Text, Badge, Banner } from '@shopify/polaris'
import { useState, useEffect, useCallback } from 'react'

interface Customer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
}

interface CustomerPickerProps {
  selectedCustomer: Customer | null
  onCustomerSelect: (customer: Customer) => void
  onCustomerCreate: (customer: Customer) => void
}

export function CustomerPicker({ 
  selectedCustomer, 
  onCustomerSelect, 
  onCustomerCreate 
}: CustomerPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

      // Recherche réactive avec délai réduit
      useEffect(() => {
        if (!searchQuery.trim()) {
          setSearchResults([])
          return
        }

        // Recherche immédiate si c'est juste une lettre
        const isShortQuery = searchQuery.trim().length <= 2
        
        const timeoutId = setTimeout(async () => {
          setIsSearching(true)
          setError(null)

          const passcode = localStorage.getItem('passcode') || ''

          try {
            const response = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery)}`, {
              headers: {
                'x-passcode': passcode
              }
            })

            if (response.ok) {
              const data = await response.json()
              setSearchResults(data.items || [])
            } else {
              const errorData = await response.json()
              setError(errorData.error || 'Erreur lors de la recherche')
            }
          } catch (err) {
            setError('Erreur de connexion lors de la recherche')
          } finally {
            setIsSearching(false)
          }
        }, isShortQuery ? 200 : 300) // Délai plus court pour les recherches courtes

        return () => clearTimeout(timeoutId)
      }, [searchQuery])

  const handleCreateCustomer = useCallback(async () => {
    if (!createForm.first_name || !createForm.last_name) {
      setError('Prénom et nom requis')
      return
    }

    setIsCreating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: createForm.first_name,
          lastName: createForm.last_name,
          email: createForm.email || undefined,
          phone: createForm.phone || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newCustomer = data.customer
        onCustomerCreate(newCustomer)
        setShowCreateModal(false)
        setCreateForm({ email: '', first_name: '', last_name: '', phone: '' })
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setError('Erreur de connexion lors de la création')
    } finally {
      setIsCreating(false)
    }
  }, [createForm, onCustomerCreate])

  return (
    <Card>
      <div style={{ padding: '16px' }}>
        <Text as="h3" variant="headingMd">Client</Text>
        
        {selectedCustomer ? (
          <div style={{ marginTop: '16px' }}>
            <Banner tone="success">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Text as="p" variant="bodyMd" fontWeight="medium">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </Text>
                <Text as="p" variant="bodySm">{selectedCustomer.email}</Text>
                {selectedCustomer.phone && (
                  <Text as="p" variant="bodySm">{selectedCustomer.phone}</Text>
                )}
              </div>
            </Banner>
            <div style={{ marginTop: '8px' }}>
              <Button size="slim" onClick={() => onCustomerSelect(null as any)}>
                Changer de client
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            <TextField
              label="Rechercher un client"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Email, nom ou téléphone..."
              helpText={isSearching ? 'Recherche en cours...' : undefined}
              autoComplete="off"
            />
            
            {error && (
              <div style={{ marginTop: '8px' }}>
                <Banner tone="critical">{error}</Banner>
              </div>
            )}
            
            {searchResults.length > 0 && (
              <div style={{ 
                marginTop: '16px', 
                maxHeight: '300px', 
                overflowY: 'auto', 
                border: '1px solid var(--p-color-border)', 
                borderRadius: 'var(--p-border-radius-100)',
                backgroundColor: 'var(--p-color-bg-surface)'
              }}>
                <div style={{ 
                  padding: '8px 12px', 
                  borderBottom: '1px solid var(--p-color-border)', 
                  backgroundColor: 'var(--p-color-bg-surface-subdued)'
                }}>
                  <Text variant="bodySm" color="subdued">
                    {searchResults.length} client{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                  </Text>
                </div>
                {Array.isArray(searchResults) && searchResults.map((customer, index) => (
                  <div
                    key={customer.id}
                    onClick={() => onCustomerSelect(customer)}
                    style={{ 
                      padding: '12px', 
                      cursor: 'pointer', 
                      borderBottom: index < searchResults.length - 1 ? '1px solid var(--p-color-border-subdued)' : 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--p-color-bg-surface-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          {customer.first_name} {customer.last_name}
                        </Text>
                        <Text as="p" variant="bodySm" color="subdued">
                          {customer.email}
                        </Text>
                        {customer.phone && (
                          <Text as="p" variant="bodySm" color="subdued">
                            📞 {customer.phone}
                          </Text>
                        )}
                      </div>
                      <div style={{ marginLeft: '12px', textAlign: 'right' }}>
                        <Text variant="bodySm" color="subdued">
                          ID: {customer.id}
                        </Text>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '16px' }}>
              <Button 
                size="slim" 
                onClick={() => setShowCreateModal(true)}
              >
                Créer une nouvelle cliente
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une nouvelle cliente"
        primaryAction={{
          content: 'Créer',
          onAction: handleCreateCustomer,
          loading: isCreating
        }}
        secondaryActions={[
          {
            content: 'Annuler',
            onAction: () => setShowCreateModal(false)
          }
        ]}
      >
        <Modal.Section>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <TextField
              label="Email"
              value={createForm.email}
              onChange={(value) => setCreateForm(prev => ({ ...prev, email: value }))}
              type="email"
            />
            <TextField
              label="Prénom"
              value={createForm.first_name}
              onChange={(value) => setCreateForm(prev => ({ ...prev, first_name: value }))}
              required
            />
            <TextField
              label="Nom"
              value={createForm.last_name}
              onChange={(value) => setCreateForm(prev => ({ ...prev, last_name: value }))}
              required
            />
            <TextField
              label="Téléphone"
              value={createForm.phone}
              onChange={(value) => setCreateForm(prev => ({ ...prev, phone: value }))}
            />
          </div>
        </Modal.Section>
      </Modal>
    </Card>
  )
}

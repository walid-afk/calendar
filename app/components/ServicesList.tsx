'use client'

import { Card, List, Badge, Button, Text } from '@shopify/polaris'

interface Service {
  id: number
  title: string
  handle: string
  images: string[]
  soin_category: string | null
  subcategory: string | null
  areas: string[]
  durationMinutes: number
  priceFrom: number
  variants: Array<{
    id: number
    title: string
    durationMinutes: number | null
    price: number | null
    area: string | null
  }>
}

interface ServicesListProps {
  services: Service[]
  onAddService: (service: Service) => void
  loading?: boolean
  error?: string | null
}

export function ServicesList({ services, onAddService, loading = false, error = null }: ServicesListProps) {
  if (loading) {
    return (
      <Card>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Text as="p">Chargement des prestations...</Text>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Text as="p">Erreur lors du chargement des prestations</Text>
          <div style={{ marginTop: '8px' }}>
            <Text as="p" variant="bodySm">{error}</Text>
          </div>
        </div>
      </Card>
    )
  }

  if (services.length === 0) {
    return (
      <Card>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Text as="p">Aucune prestation disponible</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ padding: '16px' }}>
        <Text as="h3" variant="headingMd">Prestations disponibles</Text>
        <div style={{ marginTop: '16px' }}>
          <List>
            {services.map(service => (
              <List.Item key={service.id}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <div>
                    <Text as="h4" variant="bodyMd" fontWeight="medium">
                      {service.title}
                    </Text>
                    
                    {/* Badges de taxonomie */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {service.soin_category && (
                        <Badge>{service.soin_category}</Badge>
                      )}
                      {service.subcategory && service.subcategory.trim() && (
                        <Badge>{service.subcategory}</Badge>
                      )}
                      {Array.isArray(service.areas) && service.areas.length > 0 && service.areas.map((area, index) => (
                        <Badge key={index}>{area}</Badge>
                      ))}
                    </div>
                    
                    {/* Durée et prix */}
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <Badge>{service.durationMinutes || 0} min</Badge>
                      <Badge>{(service.priceFrom || 0).toFixed(2)}€</Badge>
                    </div>
                  </div>
                  <Button 
                    size="slim" 
                    onClick={() => onAddService(service)}
                  >
                    Ajouter
                  </Button>
                </div>
              </List.Item>
            ))}
          </List>
        </div>
      </div>
    </Card>
  )
}

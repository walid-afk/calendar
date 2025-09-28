'use client'

import { Card, List, Badge, Button, Text, Divider } from '@shopify/polaris'

interface CartItem {
  id: number
  title: string
  price: string
  durationMinutes: number
}

interface CartPanelProps {
  items: CartItem[]
  onRemoveItem: (itemId: number) => void
  onClearCart: () => void
}

export function CartPanel({ items, onRemoveItem, onClearCart }: CartPanelProps) {
  const totalMinutes = items.reduce((sum, item) => sum + item.durationMinutes, 0)
  const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.price), 0)

  if (items.length === 0) {
    return (
      <Card>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Text as="p">Panier vide</Text>
          <div style={{ marginTop: '8px' }}>
            <Text as="p" variant="bodySm">
              Ajoutez des prestations pour commencer
            </Text>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text as="h3" variant="headingMd">Panier</Text>
          <Button size="slim" onClick={onClearCart}>
            Vider
          </Button>
        </div>
        
        <div style={{ marginTop: '16px' }}>
          <List>
            {Array.isArray(items) && items.map(item => (
              <List.Item key={item.id}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <div>
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      {item.title}
                    </Text>
                    <div style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
                      <Badge>{`${item.durationMinutes} min`}</Badge>
                      <Badge status="info">{item.price}€</Badge>
                    </div>
                  </div>
                  <Button 
                    size="slim" 
                    tone="critical"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              </List.Item>
            ))}
          </List>
        </div>

        <Divider />
        
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text as="p" variant="bodyMd" fontWeight="medium">Durée totale :</Text>
            <Badge status="success">{`${totalMinutes} minutes`}</Badge>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text as="p" variant="bodyMd" fontWeight="medium">Prix total :</Text>
            <Badge status="info">{totalPrice.toFixed(2)}€</Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}

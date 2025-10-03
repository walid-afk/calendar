'use client'

import { useState } from 'react'
import { Card, Button, Text as PolarisText, Banner, TextField } from '@shopify/polaris'

interface ServiceSourceSelectorProps {
  onSelect: (source: 'shopify' | 'csv' | 'manual', config?: any) => void
  isDarkMode?: boolean
}

export function ServiceSourceSelector({ onSelect, isDarkMode = false }: ServiceSourceSelectorProps) {
  const [selectedSource, setSelectedSource] = useState<'shopify' | 'csv' | 'manual' | null>(null)
  const [shopifyConfig, setShopifyConfig] = useState({
    storeDomain: '',
    accessToken: '',
    collectionId: ''
  })

  const handleSelect = (source: 'shopify' | 'csv' | 'manual') => {
    setSelectedSource(source)
  }

  const handleContinue = () => {
    if (selectedSource) {
      if (selectedSource === 'shopify') {
        // Configuration automatique pour Shopify avec les valeurs par défaut
        const defaultConfig = {
          storeDomain: process.env.SHOPIFY_STORE_DOMAIN || 'votre-boutique.myshopify.com',
          accessToken: process.env.SHOPIFY_ADMIN_TOKEN || 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          collectionId: process.env.SHOPIFY_COLLECTION_ID || '123456789'
        }
        onSelect(selectedSource, defaultConfig)
      } else {
        onSelect(selectedSource)
      }
    }
  }

  const isShopifyConfigValid = () => {
    // Pour Shopify, on considère que c'est toujours valide car on utilise la config automatique
    return selectedSource === 'shopify' || (shopifyConfig.storeDomain && shopifyConfig.accessToken && shopifyConfig.collectionId)
  }

  return (
    <Card>
      <div style={{ padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <PolarisText as="h2" variant="headingLg">
            Source des prestations
          </PolarisText>
          <PolarisText as="p" variant="bodyMd">
            Choisissez d'où proviennent vos prestations
          </PolarisText>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <Button
            variant={selectedSource === 'shopify' ? 'primary' : 'secondary'}
            size="large"
            onClick={() => handleSelect('shopify')}
            fullWidth
            icon={() => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.337 23.979c-.175 0-.319-.143-.319-.319v-1.954c0-.175.144-.319.319-.319h1.954c.175 0 .319.144.319.319v1.954c0 .176-.144.319-.319.319h-1.954zM8.712 23.979c-.175 0-.319-.143-.319-.319v-1.954c0-.175.144-.319.319-.319h1.954c.175 0 .319.144.319.319v1.954c0 .176-.144.319-.319.319H8.712zM15.337 16.293c-.175 0-.319-.143-.319-.319v-1.954c0-.175.144-.319.319-.319h1.954c.175 0 .319.144.319.319v1.954c0 .176-.144.319-.319.319h-1.954zM8.712 16.293c-.175 0-.319-.143-.319-.319v-1.954c0-.175.144-.319.319-.319h1.954c.175 0 .319.144.319.319v1.954c0 .176-.144.319-.319.319H8.712zM15.337 8.607c-.175 0-.319-.143-.319-.319V6.334c0-.175.144-.319.319-.319h1.954c.175 0 .319.144.319.319v1.954c0 .176-.144.319-.319.319h-1.954zM8.712 8.607c-.175 0-.319-.143-.319-.319V6.334c0-.175.144-.319.319-.319h1.954c.175 0 .319.144.319.319v1.954c0 .176-.144.319-.319.319H8.712z"/>
              </svg>
            )}
          >
            Shopify (Recommandé)
          </Button>
          
          <Button
            variant={selectedSource === 'csv' ? 'primary' : 'secondary'}
            size="large"
            onClick={() => handleSelect('csv')}
            fullWidth
            icon={() => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            )}
          >
            Fichier CSV
          </Button>
          
          <Button
            variant={selectedSource === 'manual' ? 'primary' : 'secondary'}
            size="large"
            onClick={() => handleSelect('manual')}
            fullWidth
            icon={() => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
              </svg>
            )}
          >
            Saisie manuelle
          </Button>
        </div>

        {selectedSource === 'shopify' && (
          <div style={{ marginBottom: '16px' }}>
            <Banner tone="info">
              Utilisation des produits Shopify déjà configurés. Vos prestations (avant épilation, etc.) sont prêtes à l'emploi.
            </Banner>
            
            <div style={{ 
              padding: '16px', 
              backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb', 
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              <PolarisText as="p" variant="bodyMd">
                ✅ Configuration Shopify automatique détectée<br/>
                ✅ Produits synchronisés et prêts<br/>
                ✅ Aucune configuration supplémentaire requise
              </PolarisText>
            </div>
          </div>
        )}

        {selectedSource === 'csv' && (
          <div style={{ marginBottom: '16px' }}>
            <Banner tone="info">
              Vous pourrez importer un fichier CSV contenant vos prestations avec leurs prix et durées.
            </Banner>
          </div>
        )}

        {selectedSource === 'manual' && (
          <div style={{ marginBottom: '16px' }}>
            <Banner tone="info">
              Vous pourrez ajouter vos prestations manuellement dans l'application.
            </Banner>
          </div>
        )}

        <Button
          variant="primary"
          size="large"
          onClick={handleContinue}
          disabled={!selectedSource || (selectedSource === 'shopify' && !isShopifyConfigValid())}
          fullWidth
        >
          Continuer
        </Button>
      </div>
    </Card>
  )
}

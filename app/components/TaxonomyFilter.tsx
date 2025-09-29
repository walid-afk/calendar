'use client'
import { useState, useEffect } from 'react'
import { Card, Select, Button, BlockStack, Text, Badge } from '@shopify/polaris'

interface TaxonomyFilterProps {
  onFilterChange: (filters: {
    category?: string
    subcategory?: string
    area?: string
  }) => void
  initialFilters?: {
    category?: string
    subcategory?: string
    area?: string
  }
  showFilters?: boolean
  onToggleFilters?: () => void
}

interface TaxonomyData {
  categories: string[]
  subcategories: string[]
  areas: string[]
}

export default function TaxonomyFilter({
  onFilterChange,
  initialFilters = {},
  showFilters = false,
  onToggleFilters
}: TaxonomyFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '')
  const [selectedSubcategory, setSelectedSubcategory] = useState(initialFilters.subcategory || '')
  const [selectedArea, setSelectedArea] = useState(initialFilters.area || '')
  const [taxonomyData, setTaxonomyData] = useState<TaxonomyData>({
    categories: [],
    subcategories: [],
    areas: []
  })
  const [loading, setLoading] = useState(false)

  // Charger les données de taxonomie
  useEffect(() => {
    const loadTaxonomyData = async () => {
      setLoading(true)
      try {
        // Charger tous les produits pour extraire les catégories, sous-catégories et zones
        const response = await fetch('/api/products')
        const data = await response.json()
        
        if (data.items) {
          const categories = new Set<string>()
          const subcategories = new Set<string>()
          const areas = new Set<string>()
          
          data.items.forEach((product: any) => {
            if (product.soin_category && typeof product.soin_category === 'string') {
              categories.add(product.soin_category)
            }
            if (product.subcategory && typeof product.subcategory === 'string') {
              subcategories.add(product.subcategory)
            }
            if (product.areas && Array.isArray(product.areas)) {
              product.areas.forEach((area: string) => {
                if (area && typeof area === 'string') {
                  areas.add(area)
                }
              })
            }
          })
          
          setTaxonomyData({
            categories: Array.from(categories).sort(),
            subcategories: Array.from(subcategories).sort(),
            areas: Array.from(areas).sort()
          })
        }
      } catch (error) {
        console.error('Erreur chargement taxonomie:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTaxonomyData()
  }, [])

  // Notifier les changements de filtres
  useEffect(() => {
    onFilterChange({
      category: selectedCategory || undefined,
      subcategory: selectedSubcategory || undefined,
      area: selectedArea || undefined
    })
  }, [selectedCategory, selectedSubcategory, selectedArea, onFilterChange])

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedArea('')
  }

  const activeFiltersCount = [selectedCategory, selectedSubcategory, selectedArea].filter(Boolean).length

  if (!showFilters) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <Button onClick={onToggleFilters}>
          Filtres {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <BlockStack gap="400">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text as="h3" variant="headingMd">Filtres</Text>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {activeFiltersCount > 0 && (
              <Badge>{`${activeFiltersCount} filtre(s) actif(s)`}</Badge>
            )}
            <Button onClick={onToggleFilters} size="slim">
              Masquer
            </Button>
          </div>
        </div>

        {loading ? (
          <Text as="p">Chargement des filtres...</Text>
        ) : (
          <BlockStack gap="300">
            <Select
              label="Catégorie"
              options={[
                { label: 'Toutes les catégories', value: '' },
                ...(Array.isArray(taxonomyData.categories) ? taxonomyData.categories.map(cat => ({ label: cat, value: cat })) : [])
              ]}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />

            <Select
              label="Sous-catégorie"
              options={[
                { label: 'Toutes les sous-catégories', value: '' },
                ...(Array.isArray(taxonomyData.subcategories) ? taxonomyData.subcategories.map(sub => ({ label: sub, value: sub })) : [])
              ]}
              value={selectedSubcategory}
              onChange={setSelectedSubcategory}
            />

            <Select
              label="Zone"
              options={[
                { label: 'Toutes les zones', value: '' },
                ...(Array.isArray(taxonomyData.areas) ? taxonomyData.areas.map(area => ({ label: area, value: area })) : [])
              ]}
              value={selectedArea}
              onChange={setSelectedArea}
            />

            {activeFiltersCount > 0 && (
              <Button onClick={resetFilters} size="slim">
                Réinitialiser les filtres
              </Button>
            )}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Card, Select, Button, BlockStack, Text, Badge } from '@shopify/polaris'
import { getSubcategoriesForCategory, getZonesForSubcategory } from '@/lib/categories'

interface Category {
  id: string
  title: string
  handle: string
  published: boolean
  subcategories: string[]
}

interface CategoryFilterProps {
  onFilterChange: (filters: {
    collectionId?: string
    subcategory?: string
    area?: string
  }) => void
  initialFilters?: {
    collectionId?: string
    subcategory?: string
    area?: string
  }
  showFilters?: boolean
  onToggleFilters?: () => void
}

export function CategoryFilter({ onFilterChange, initialFilters = {}, showFilters = false, onToggleFilters }: CategoryFilterProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilters.collectionId || '')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialFilters.subcategory || '')
  const [selectedArea, setSelectedArea] = useState<string>(initialFilters.area || '')
  const [subcategories, setSubcategories] = useState<string[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory)
      if (category) {
        const subs = getSubcategoriesForCategory(category.handle)
        setSubcategories(subs)
        setSelectedSubcategory('')
        setSelectedArea('')
        setAreas([])
      }
    } else {
      setSubcategories([])
      setSelectedSubcategory('')
      setSelectedArea('')
      setAreas([])
    }
  }, [selectedCategory, categories])

  useEffect(() => {
    if (selectedSubcategory) {
      const zones = getZonesForSubcategory(selectedSubcategory)
      setAreas(zones)
      setSelectedArea('')
    } else {
      setAreas([])
      setSelectedArea('')
    }
  }, [selectedSubcategory])

  useEffect(() => {
    onFilterChange({
      collectionId: selectedCategory || undefined,
      subcategory: selectedSubcategory || undefined,
      area: selectedArea || undefined
    })
  }, [selectedCategory, selectedSubcategory, selectedArea, onFilterChange])

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: { 'x-passcode': '1234' } // TODO: Récupérer le passcode depuis le contexte
      })
      const data = await response.json()
      setCategories(data.items || [])
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error)
      // Fallback avec des catégories par défaut
      setCategories([
        { id: '666821853528', title: 'Épilation', handle: 'epilation', published: true, subcategories: ['haute-frequence', 'ipl', 'cire'] },
        { id: '666821886296', title: 'Mains & Pieds', handle: 'mains-pieds', published: true, subcategories: ['mains', 'pieds'] },
        { id: '666822017368', title: 'Soins corps', handle: 'soins-corps', published: true, subcategories: [] },
        { id: '666822148440', title: 'Soin visage', handle: 'soin-visage', published: true, subcategories: [] },
        { id: '666822213976', title: 'Maquillage & Teinture', handle: 'maquillage-teinture', published: true, subcategories: ['maquillage', 'teinture'] }
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedArea('')
  }

  const hasActiveFilters = selectedCategory || selectedSubcategory || selectedArea

  if (loading) {
    return (
      <Card>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Text>Chargement des catégories...</Text>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div style={{ padding: '16px' }}>
        <BlockStack gap="400">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headingMd" as="h3">
              Filtres
            </Text>
            {onToggleFilters && (
              <Button onClick={onToggleFilters} size="slim">
                {showFilters ? 'Masquer' : 'Afficher'} les filtres
              </Button>
            )}
          </div>
          
          {hasActiveFilters && (
            <div>
              <Badge status="info">
                {[selectedCategory, selectedSubcategory, selectedArea].filter(Boolean).length} filtre(s) actif(s)
              </Badge>
            </div>
          )}

          {showFilters && (
            <div>

          <Select
            label="Catégorie"
            options={[
              { label: 'Toutes les catégories', value: '' },
              ...categories.map(category => ({
                label: category.title,
                value: category.id
              }))
            ]}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />

          {subcategories.length > 0 && (
            <Select
              label="Sous-catégorie"
              options={[
                { label: 'Toutes les sous-catégories', value: '' },
                ...subcategories.map(sub => ({
                  label: sub.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' '),
                  value: sub
                }))
              ]}
              value={selectedSubcategory}
              onChange={setSelectedSubcategory}
            />
          )}

          {areas.length > 0 && (
            <Select
              label="Zone"
              options={[
                { label: 'Toutes les zones', value: '' },
                ...areas.map(area => ({
                  label: area.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' '),
                  value: area
                }))
              ]}
              value={selectedArea}
              onChange={setSelectedArea}
            />
          )}

              {hasActiveFilters && (
                <Button onClick={clearFilters} size="slim">
                  Effacer les filtres
                </Button>
              )}
            </div>
          )}
        </BlockStack>
      </div>
    </Card>
  )
}

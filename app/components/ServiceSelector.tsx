'use client'

import { useState, useEffect } from 'react'
import { Select, Spinner, Text } from '@shopify/polaris'
import { getAllCategories } from '@/lib/category-mapping'

interface SubcategoryOption {
  value: string
  label: string
}

interface ProductVariant {
  id: number
  title: string
  price: number
  duration: number
  area?: string
  productId: number
  productTitle: string
}

interface ServiceSelectorProps {
  onVariantSelect: (variant: ProductVariant) => void
  selectedVariant?: ProductVariant | null
}

// Mapping des IDs de collection vers les titres
const CATEGORY_TITLES: Record<string, string> = {
  '666821853528': 'Épilation',
  '666821886296': 'Mains & Pieds',
  '666822017368': 'Soins Corps',
  '666822148440': 'Soins Visage',
  '666822213976': 'Maquillage & Teinture'
}

export default function ServiceSelector({ onVariantSelect, selectedVariant }: ServiceSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)

  // Options des catégories depuis le mapping statique
  const categories = getAllCategories()
  const categoryOptions = [
    { label: 'Choisir une catégorie', value: '' },
    ...categories.map(cat => ({
      label: cat.label,
      value: cat.handle
    }))
  ]

  // Charger les sous-catégories quand la catégorie change
  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([])
      setVariants([])
      setSelectedSubcategory('')
      setSelectedProduct('')
      return
    }

    setLoadingSubcategories(true)
    fetch(`/api/products/select-data?categoryHandle=${selectedCategory}`)
      .then(res => res.json())
      .then(data => {
        setSubcategories(data.subcategories || [])
        setVariants([])
        setSelectedSubcategory('')
        setSelectedProduct('')
      })
      .catch(error => {
        console.error('Erreur chargement sous-catégories:', error)
        setSubcategories([])
      })
      .finally(() => {
        setLoadingSubcategories(false)
      })
  }, [selectedCategory])

  // Charger les variantes quand la sous-catégorie change
  useEffect(() => {
    if (!selectedCategory || !selectedSubcategory) {
      return
    }

    setLoadingVariants(true)
    fetch(`/api/products/select-data?categoryHandle=${selectedCategory}&subcategoryHandle=${selectedSubcategory}`)
      .then(res => res.json())
      .then(data => {
        setVariants(data.variants || [])
        setSelectedProduct('')
      })
      .catch(error => {
        console.error('Erreur chargement variantes:', error)
        setVariants([])
      })
      .finally(() => {
        setLoadingVariants(false)
      })
  }, [selectedCategory, selectedSubcategory])

  // Gérer la sélection d'une variante
  const handleVariantChange = (variantId: string) => {
    setSelectedProduct(variantId)
    
    if (variantId) {
      const variant = variants.find(v => v.id.toString() === variantId)
      if (variant) {
        onVariantSelect(variant)
      }
    } else {
      onVariantSelect(null as any)
    }
  }

  // Options des sous-catégories
  const subcategoryOptions = [
    { label: 'Choisir une sous-catégorie', value: '' },
    ...subcategories.map(sub => ({
      label: sub.label,
      value: sub.value
    }))
  ]

  // Options des variantes
  const variantOptions = [
    { label: 'Choisir une prestation', value: '' },
    ...variants.map(variant => ({
      label: `${variant.productTitle} - ${variant.title} (${variant.duration} min)`,
      value: variant.id.toString()
    }))
  ]


  return (
    <div style={{ marginBottom: '20px' }}>
      <Text as="h3" variant="headingMd">Sélection de la prestation</Text>
      
      {/* Menu 1: Catégorie */}
      <div style={{ marginBottom: '16px' }}>
        <Select
          label="Catégorie"
          options={categoryOptions}
          value={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

        {/* Menu 2: Sous-catégorie */}
        {selectedCategory && subcategories.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Select
              label="Sous-catégorie"
              options={subcategoryOptions}
              value={selectedSubcategory}
              onChange={setSelectedSubcategory}
              disabled={loadingSubcategories}
              helpText={loadingSubcategories ? 'Chargement...' : undefined}
            />
            {loadingSubcategories && <Spinner size="small" />}
          </div>
        )}

      {/* Menu 3: Prestation/Variante */}
      {selectedCategory && selectedSubcategory && (
        <div style={{ marginBottom: '16px' }}>
          <Select
            label="Prestation"
            options={variantOptions}
            value={selectedProduct}
            onChange={handleVariantChange}
            disabled={loadingVariants}
            helpText={loadingVariants ? 'Chargement...' : undefined}
          />
          {loadingVariants && <Spinner size="small" />}
          
          {!loadingVariants && variants.length === 0 && (
            <div>
              <Text as="p" variant="bodySm" tone="subdued">
                Aucune prestation définie pour cette sous-catégorie.
              </Text>
            </div>
          )}
          
        </div>
      )}

      {/* Affichage de la variante sélectionnée */}
      {selectedVariant && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f6f6f7', 
          borderRadius: '8px',
          marginTop: '16px'
        }}>
          <Text as="p" variant="bodyMd">
            <strong>Prestation sélectionnée :</strong> {selectedVariant.productTitle} - {selectedVariant.title}
          </Text>
          <Text as="p" variant="bodySm">
            Durée : {selectedVariant.duration} min • Prix : {selectedVariant.price.toFixed(2)}€
            {selectedVariant.area && ` • Zone : ${selectedVariant.area}`}
          </Text>
        </div>
      )}
    </div>
  )
}

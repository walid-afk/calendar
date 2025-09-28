import { NextRequest } from 'next/server'
import { CATEGORY_MAP, getSubcategoriesForCategory, getProductIdsForSubcategory } from '@/lib/category-mapping'
import { getVariantDuration } from '@/lib/variant-durations'

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

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categoryHandle = searchParams.get('categoryHandle')
    const subcategoryHandle = searchParams.get('subcategoryHandle')

    if (!categoryHandle) {
      return Response.json({ error: 'categoryHandle requis' }, { status: 400 })
    }

    // Vérifier la configuration Shopify
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
    const accessToken = process.env.SHOPIFY_ADMIN_TOKEN
    
    if (!storeDomain || !accessToken) {
      return Response.json({ error: 'Configuration Shopify manquante' }, { status: 500 })
    }

    // 1. Récupérer les sous-catégories pour une catégorie
    if (!subcategoryHandle) {
      const subcategories = getSubcategoriesForCategory(categoryHandle)
      const subcategoryOptions: SubcategoryOption[] = subcategories.map(sub => ({
        value: sub.handle,
        label: sub.label
      }))
      return Response.json({ subcategories: subcategoryOptions })
    }

    // 2. Récupérer les variantes des produits de la sous-catégorie
    const productIds = getProductIdsForSubcategory(categoryHandle, subcategoryHandle)
    
    if (productIds.length === 0) {
      return Response.json({ variants: [] })
    }

    // Charger les produits par IDs
    const variants: ProductVariant[] = []

    for (const productId of productIds) {
      try {
        const response = await fetch(`https://${storeDomain}/admin/api/2025-07/products/${productId}.json`, {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) continue

        const data = await response.json()
        const product = data.product

        if (!product) continue

        // Ajouter toutes les variantes
        for (const variant of product.variants || []) {
          // Utiliser le mapping manuel des durées par ID de variante
          const duration = getVariantDuration(variant.id);
          
          variants.push({
            id: variant.id,
            title: variant.title,
            price: parseFloat(variant.price) || 0,
            duration,
            area: undefined,
            productId: product.id,
            productTitle: product.title
          })
        }
      } catch (error) {
        // Ignorer les erreurs
      }
    }

    return Response.json({ variants })

  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export const GET = handler
import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getPrestationsProducts } from '@/lib/shopify'
import { getProductWithTaxonomy, normalizeHandle } from '@/lib/taxonomy'
import { clearShopifyCache } from '@/lib/shopify-throttle'

interface ProductFilters {
  category?: string
  subcategory?: string
  area?: string
  collectionId?: string
}

async function handler(req: NextRequest) {
  try {
    // Vérifier la configuration Shopify au début
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
    const accessToken = process.env.SHOPIFY_ADMIN_TOKEN
    
    if (!storeDomain || !accessToken) {
      const missingVars = []
      if (!storeDomain) missingVars.push('SHOPIFY_STORE_DOMAIN')
      if (!accessToken) missingVars.push('SHOPIFY_ADMIN_TOKEN')
      
      console.error('❌ Configuration Shopify manquante:', missingVars)
      return Response.json(
        { 
          error: 'Configuration Shopify manquante', 
          missing: missingVars,
          message: 'Vérifiez les variables d\'environnement SHOPIFY_STORE_DOMAIN et SHOPIFY_ADMIN_TOKEN'
        },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(req.url)
    const filters: ProductFilters = {
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      area: searchParams.get('area') || undefined,
      collectionId: searchParams.get('collectionId') || undefined
    }
    
    // Vider le cache si demandé
    if (searchParams.get('clearCache') === 'true') {
      clearShopifyCache()
    }
    
    // Si aucun filtre n'est fourni, charger tous les produits par défaut
    if (!filters.category && !filters.subcategory && !filters.area && !filters.collectionId) {
      console.log('📦 Loading all products without filters')
      const products = await getPrestationsProducts()
      console.log(`📦 Loaded ${products.length} products`)
      return Response.json({ items: products })
    }
    
    // Récupérer tous les produits et les filtrer
    console.log('📦 Loading all products with filters:', filters)
    const allProducts = await getPrestationsProducts()
    console.log(`📦 Loaded ${allProducts.length} products for filtering`)
    const filteredProducts = []
    
    for (const product of allProducts) {
      try {
        const productWithTaxonomy = await getProductWithTaxonomy(product.id)
        if (!productWithTaxonomy) continue
        
        // Filtrage par catégorie
        if (filters.category) {
          const categoryMatch = productWithTaxonomy.soin_category === filters.category ||
                               productWithTaxonomy.tags.includes(`catégorie:${filters.category}`)
          if (!categoryMatch) continue
        }
        
        // Filtrage par sous-catégorie
        if (filters.subcategory) {
          const subcategoryMatch = productWithTaxonomy.subcategory === filters.subcategory ||
                                  productWithTaxonomy.tags.includes(`sous-cat:${filters.subcategory}`)
          if (!subcategoryMatch) continue
        }
        
        // Filtrage par zone
        if (filters.area) {
          const areaMatch = productWithTaxonomy.areas.includes(filters.area) ||
                           productWithTaxonomy.tags.includes(`zone:${filters.area}`)
          if (!areaMatch) continue
        }
        
        // Calculer la durée et le prix (priorité variante > produit)
        let durationMinutes = productWithTaxonomy.duration_minutes
        let priceFrom = productWithTaxonomy.price_from
        
        // Si des variantes ont des métachamps, utiliser la première disponible
        const variantWithMetafields = productWithTaxonomy.variants.find(v => 
          v.duration_minutes !== null || v.price_from !== null
        )
        
        if (variantWithMetafields) {
          durationMinutes = variantWithMetafields.duration_minutes || durationMinutes
          priceFrom = variantWithMetafields.price_from || priceFrom
        }
        
        // Normaliser les données pour éviter les undefined
        const normalizedAreas = Array.isArray(productWithTaxonomy.areas) 
          ? productWithTaxonomy.areas.filter(area => area && typeof area === 'string')
          : []
        
        const normalizedVariants = Array.isArray(productWithTaxonomy.variants)
          ? productWithTaxonomy.variants.map(variant => ({
              id: variant.id || 0,
              title: variant.title || '',
              durationMinutes: variant.duration_minutes || null,
              price: variant.price_from || null,
              area: variant.area || null
            }))
          : []

        filteredProducts.push({
          id: productWithTaxonomy.id,
          title: productWithTaxonomy.title || 'Produit sans titre',
          handle: productWithTaxonomy.handle || '',
          images: Array.isArray(productWithTaxonomy.images) ? productWithTaxonomy.images : [],
          soin_category: productWithTaxonomy.soin_category || null,
          subcategory: productWithTaxonomy.subcategory || null,
          areas: normalizedAreas,
          durationMinutes: durationMinutes || 30, // Fallback par défaut
          priceFrom: priceFrom || parseFloat(product.price) || 0,
          variants: normalizedVariants
        })
      } catch (error) {
        console.error(`Erreur traitement produit ${product.id}:`, error)
        // Continuer avec le produit de base en cas d'erreur
        filteredProducts.push({
          id: product.id || 0,
          title: product.title || 'Produit sans titre',
          handle: (product.title || 'produit').toLowerCase().replace(/[^a-z0-9]/g, '-'),
          images: [],
          soin_category: null,
          subcategory: null,
          areas: [],
          durationMinutes: product.durationMinutes || 30,
          priceFrom: parseFloat(product.price) || 0,
          variants: []
        })
      }
    }
    
    console.log(`📦 Returning ${filteredProducts.length} filtered products`)
    return Response.json({ items: filteredProducts })
  } catch (error) {
    console.error('Erreur Shopify:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la récupération des produits' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)
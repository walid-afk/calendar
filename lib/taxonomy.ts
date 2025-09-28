// Import de la fonction de throttling
import { shopifyFetchWithThrottle } from './shopify-throttle'

async function shopifyFetch(path: string, method: string = 'GET', body?: any) {
  const response = await shopifyFetchWithThrottle(path, method, body, {
    useCache: true,
    cacheTtl: 30000 // 30 secondes
  })
  return response.data
}

export interface ProductTaxonomy {
  id: number
  title: string
  handle: string
  soin_category: string | null
  subcategory: string | null
  areas: string[]
  duration_minutes: number | null
  price_from: number | null
  tags: string[]
}

export interface VariantTaxonomy {
  id: number
  title: string
  duration_minutes: number | null
  price_from: number | null
  area: string | null
}

export interface ProductWithTaxonomy extends ProductTaxonomy {
  variants: VariantTaxonomy[]
  images: string[]
}

/**
 * Normalise une chaîne en handle (kebab-case, sans accents)
 */
export function normalizeHandle(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garde seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
    .replace(/-+/g, '-') // Supprime les tirets multiples
    .replace(/^-|-$/g, '') // Supprime les tirets en début/fin
}

/**
 * Génère les tags normalisés à partir des données produit
 */
export function generateNormalizedTags(product: ProductTaxonomy): string[] {
  const tags: string[] = []
  
  // Tag catégorie
  if (product.soin_category) {
    tags.push(`catégorie:${product.soin_category}`)
  }
  
  // Tag sous-catégorie
  if (product.subcategory) {
    tags.push(`sous-cat:${product.subcategory}`)
  }
  
  // Tags zones
  for (const area of product.areas) {
    tags.push(`zone:${area}`)
  }
  
  // Tag durée
  if (product.duration_minutes) {
    tags.push(`durée:${product.duration_minutes}`)
  }
  
  // Tag prix (optionnel)
  if (product.price_from) {
    tags.push(`prix:${product.price_from}`)
  }
  
  return tags
}

/**
 * Synchronise les tags d'un produit (fonction simplifiée)
 */
export async function syncProductTags(productId: number): Promise<boolean> {
  try {
    // Récupérer le produit avec ses tags
    const product = await getProductWithTags(productId)
    if (!product) return false
    
    // Générer les tags normalisés
    const normalizedTags = generateNormalizedTags(product)
    
    // Nettoyer les tags existants (supprimer les anciens tags structurés)
    const existingTags = product.tags.filter(tag => 
      !tag.startsWith('catégorie:') && 
      !tag.startsWith('sous-cat:') && 
      !tag.startsWith('zone:') &&
      !tag.startsWith('durée:') &&
      !tag.startsWith('prix:')
    )
    
    // Combiner les tags existants avec les nouveaux
    const allTags = [...existingTags, ...normalizedTags]
    
    // Mettre à jour le produit
    await shopifyFetch(`products/${productId}.json`, 'PUT', {
      product: {
        id: productId,
        tags: allTags.join(', ')
      }
    })
    
    return true
  } catch (error) {
    console.error(`Erreur synchronisation tags produit ${productId}:`, error)
    return false
  }
}

/**
 * Récupère un produit avec ses tags (au lieu des métachamps)
 */
export async function getProductWithTags(productId: number): Promise<ProductTaxonomy | null> {
  try {
    const productData = await shopifyFetch(`products/${productId}.json`)
    const product = productData.product
    const tags = product.tags ? product.tags.split(', ') : []
    
    // Extraire les valeurs depuis les tags
    const soin_category = tags.find(tag => tag.startsWith('catégorie:'))?.split(':')[1] || null
    const subcategory = tags.find(tag => tag.startsWith('sous-cat:'))?.split(':')[1] || null
    const areas = tags.filter(tag => tag.startsWith('zone:')).map(tag => tag.split(':')[1])
    
    // Durée depuis les tags
    const durationTag = tags.find(tag => tag.startsWith('durée:'))
    const duration_minutes = durationTag ? parseInt(durationTag.split(':')[1]) : null
    
    // Prix depuis les tags (optionnel)
    const priceTag = tags.find(tag => tag.startsWith('prix:'))
    const price_from = priceTag ? parseFloat(priceTag.split(':')[1]) : null
    
    return {
      id: product.id,
      title: product.title,
      handle: product.handle,
      soin_category,
      subcategory,
      areas,
      duration_minutes,
      price_from,
      tags
    }
  } catch (error) {
    console.error(`Erreur récupération produit ${productId}:`, error)
    return null
  }
}

/**
 * Récupère les variantes d'un produit avec leurs métachamps
 */
export async function getVariantsWithMetafields(productId: number): Promise<VariantTaxonomy[]> {
  try {
    const productData = await shopifyFetch(`products/${productId}.json`)
    const variants = productData.product.variants || []
    
    const variantsWithMetafields: VariantTaxonomy[] = []
    
    for (const variant of variants) {
      try {
        const metafieldsData = await shopifyFetch(`variants/${variant.id}/metafields.json`)
        const metafields = metafieldsData.metafields || []
        
        const duration_minutes = metafields.find((m: any) => m.namespace === 'custom' && m.key === 'duration_minutes')?.value || null
        const price_from = metafields.find((m: any) => m.namespace === 'custom' && m.key === 'price_from')?.value || null
        const area = metafields.find((m: any) => m.namespace === 'custom' && m.key === 'area')?.value || null
        
        variantsWithMetafields.push({
          id: variant.id,
          title: variant.title,
          duration_minutes: duration_minutes ? parseInt(duration_minutes) : null,
          price_from: price_from ? parseFloat(price_from) : null,
          area
        })
      } catch (error) {
        console.error(`Erreur métachamps variante ${variant.id}:`, error)
        // Ajouter la variante sans métachamps
        variantsWithMetafields.push({
          id: variant.id,
          title: variant.title,
          duration_minutes: null,
          price_from: null,
          area: null
        })
      }
    }
    
    return variantsWithMetafields
  } catch (error) {
    console.error(`Erreur récupération variantes produit ${productId}:`, error)
    return []
  }
}

/**
 * Récupère un produit complet avec variantes et tags
 */
export async function getProductWithTaxonomy(productId: number): Promise<ProductWithTaxonomy | null> {
  try {
    const product = await getProductWithTags(productId)
    if (!product) return null
    
    // Pour les variantes, on utilise les données de base (pas de métachamps)
    const productData = await shopifyFetch(`products/${productId}.json`)
    const variants = productData.product.variants?.map((variant: any) => ({
      id: variant.id,
      title: variant.title,
      duration_minutes: null, // Pas de métachamps
      price_from: parseFloat(variant.price) || null,
      area: null // Pas de métachamps
    })) || []
    
    // Récupérer les images
    const images = productData.product.images?.map((img: any) => img.src) || []
    
    return {
      ...product,
      variants,
      images
    }
  } catch (error) {
    console.error(`Erreur récupération produit complet ${productId}:`, error)
    return null
  }
}

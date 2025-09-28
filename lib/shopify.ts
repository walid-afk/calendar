export interface ShopifyProduct {
  id: number
  title: string
  price: string
  durationMinutes: number
}

export interface ShopifyCustomer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
}

export interface CreateCustomerData {
  email: string
  first_name: string
  last_name: string
  phone?: string
}

// Import de la fonction de throttling
import { shopifyFetchWithThrottle, shopifyFetchAllPages } from './shopify-throttle'

/**
 * Effectue une requête vers l'API Shopify Admin avec throttling
 */
async function shopifyFetch(path: string, method: string = 'GET', body?: any) {
  const response = await shopifyFetchWithThrottle(path, method, body, {
    useCache: true,
    cacheTtl: 30000 // 30 secondes
  })
  return response.data
}

/**
 * Récupère toutes les pages d'une ressource Shopify
 */
async function shopifyFetchAll(path: string, options?: any) {
  return shopifyFetchAllPages(path, {
    useCache: true,
    cacheTtl: 30000,
    ...options
  })
}

/**
 * Récupère l'ID d'une collection par son handle
 */
export async function getCollectionIdByHandle(handle: string): Promise<number | null> {
  try {
    // Essayer d'abord les custom collections
    const customResponse = await shopifyFetch(`custom_collections.json?handle=${handle}`)
    if (customResponse.custom_collections && customResponse.custom_collections.length > 0) {
      return customResponse.custom_collections[0].id
    }

    // Puis les smart collections
    const smartResponse = await shopifyFetch(`smart_collections.json?handle=${handle}`)
    if (smartResponse.smart_collections && smartResponse.smart_collections.length > 0) {
      return smartResponse.smart_collections[0].id
    }

    return null
  } catch (error) {
    console.error('Erreur lors de la récupération de la collection:', error)
    return null
  }
}

/**
 * Récupère les produits d'une collection
 */
export async function getProductsByCollectionId(collectionId: number): Promise<ShopifyProduct[]> {
  try {
    console.log(`🛍️ Fetching products for collection ${collectionId}`)
    // Utiliser la pagination automatique avec throttling
    const allProducts = await shopifyFetchAll(`collections/${collectionId}/products.json`, {
      pageSize: 250
    })
    console.log(`🛍️ Found ${allProducts.length} products in collection ${collectionId}`)
    
    const products: ShopifyProduct[] = []
    
    // Traiter les produits en batch pour optimiser les appels
    const batchSize = 10
    for (let i = 0; i < allProducts.length; i += batchSize) {
      const batch = allProducts.slice(i, i + batchSize)
      
      // Traiter le batch en parallèle avec throttling
      const batchPromises = batch.map(async (product: any) => {
        try {
          // Récupérer les détails complets du produit avec ses variantes
          const productDetail = await shopifyFetch(`products/${product.id}.json`)
          const fullProduct = productDetail.product
          
          // Vérifier que le produit a des variantes
          if (!fullProduct.variants || fullProduct.variants.length === 0) {
            console.log(`Produit ${fullProduct.id} sans variantes, ignoré`)
            return null
          }
          
          // Prix minimum des variantes
          const prices = fullProduct.variants.map((v: any) => parseFloat(v.price || '0')).filter((p: number) => !isNaN(p))
          if (prices.length === 0) {
            console.log(`Produit ${fullProduct.id} sans prix valide, ignoré`)
            return null
          }
          
          const minPrice = Math.min(...prices)
          
          // Récupérer la durée depuis les tags
          const durationMinutes = await getProductDuration(fullProduct)
          
          return {
            id: fullProduct.id,
            title: fullProduct.title,
            price: minPrice.toFixed(2),
            durationMinutes
          }
          
        } catch (error) {
          console.log(`Erreur lors du traitement du produit ${product.id}:`, error instanceof Error ? error.message : String(error))
          return null
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      products.push(...batchResults.filter(p => p !== null))
    }

    console.log(`🛍️ Returning ${products.length} processed products`)
    return products
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    return []
  }
}

/**
 * Récupère la durée d'un produit depuis ses tags
 */
export async function getProductDuration(product: any): Promise<number> {
  try {
    // Normaliser les tags (peuvent être string ou array)
    let tags: string[] = []
    if (typeof product.tags === 'string') {
      tags = product.tags.split(', ').map((tag: string) => tag.trim())
    } else if (Array.isArray(product.tags)) {
      tags = product.tags
    }

    // Chercher le tag "durée:XX" dans les tags du produit
    const durationTag = tags.find((tag: string) => tag.startsWith('durée:'))
    if (durationTag) {
      const duration = parseInt(durationTag.split(':')[1])
      if (!isNaN(duration)) {
        return duration
      }
    }

    // Fallback : chercher dans le titre du produit
    const titleMatch = product.title?.match(/(\d+)\s*min/i)
    if (titleMatch) {
      return parseInt(titleMatch[1])
    }

    return 30 // Durée par défaut
  } catch (error) {
    console.error('Erreur lors de la récupération de la durée:', error)
    return 30
  }
}

/**
 * Recherche des clients
 */
export async function searchCustomers(query: string): Promise<ShopifyCustomer[]> {
  try {
    const response = await shopifyFetch(`customers/search.json?query=${encodeURIComponent(query)}`)
    
    if (!response.customers) {
      return []
    }

    return response.customers.map((customer: any) => ({
      id: customer.id,
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || ''
    }))
  } catch (error) {
    console.error('Erreur lors de la recherche de clients:', error)
    return []
  }
}

/**
 * Crée un nouveau client
 */
export async function createCustomer(data: CreateCustomerData): Promise<ShopifyCustomer> {
  try {
    const response = await shopifyFetch('customers.json', 'POST', {
      customer: data
    })

    const customer = response.customer
    return {
      id: customer.id,
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || ''
    }
  } catch (error) {
    console.error('Erreur lors de la création du client:', error)
    throw new Error('Impossible de créer le client')
  }
}

/**
 * Récupère tous les produits de la collection de prestations
 */
export async function getPrestationsProducts(): Promise<ShopifyProduct[]> {
  // Utiliser directement l'ID de collection configuré
  const collectionId = process.env.SHOPIFY_COLLECTION_ID || '271113748537'
  
  if (!collectionId) {
    throw new Error('ID de collection non configuré')
  }

  return getProductsByCollectionId(parseInt(collectionId))
}

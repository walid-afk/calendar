interface ShopifyResponse {
  data: any
  headers: Headers
  status: number
}

interface ThrottleState {
  lastCall: number
  callCount: number
  bucketSize: number
  currentUsage: number
}

// État global du throttling
let throttleState: ThrottleState = {
  lastCall: 0,
  callCount: 0,
  bucketSize: 40,
  currentUsage: 0
}

// Cache mémoire simple
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

/**
 * Nettoie le cache expiré
 */
function cleanExpiredCache() {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key)
    }
  }
}

/**
 * Génère une clé de cache basée sur l'URL et les options
 */
function generateCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET'
  const body = options?.body ? JSON.stringify(options.body) : ''
  return `${method}:${url}:${body}`
}

/**
 * Attend un délai en millisecondes
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Parse le header X-Shopify-Shop-Api-Call-Limit
 */
function parseCallLimit(header: string | null): { current: number; limit: number } | null {
  if (!header) return null
  
  const match = header.match(/(\d+)\/(\d+)/)
  if (match) {
    return {
      current: parseInt(match[1], 10),
      limit: parseInt(match[2], 10)
    }
  }
  return null
}

/**
 * Calcule le délai d'attente basé sur l'utilisation du bucket
 */
function calculateThrottleDelay(currentUsage: number, limit: number): number {
  const usageRatio = currentUsage / limit
  
  // Si on approche de la limite (≥ 85%), attendre plus longtemps
  if (usageRatio >= 0.85) {
    return 2000 // 2 secondes
  } else if (usageRatio >= 0.7) {
    return 1000 // 1 seconde
  } else if (usageRatio >= 0.5) {
    return 500 // 500ms
  }
  
  return 0 // Pas d'attente
}

/**
 * Fonction principale de throttling Shopify
 */
export async function shopifyFetchWithThrottle(
  path: string, 
  method: string = 'GET', 
  body?: any,
  options: { 
    useCache?: boolean
    cacheTtl?: number
    maxRetries?: number
  } = {}
): Promise<ShopifyResponse> {
  const {
    useCache = true,
    cacheTtl = 30000, // 30 secondes par défaut
    maxRetries = 3
  } = options

  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
  const accessToken = process.env.SHOPIFY_ADMIN_TOKEN
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01'

  // Log des variables d'environnement pour debug
  console.log('🔧 Shopify config check:', {
    storeDomain: storeDomain ? '✅' : '❌',
    accessToken: accessToken ? '✅' : '❌',
    apiVersion: apiVersion
  })

  if (!storeDomain || !accessToken) {
    const missingVars = []
    if (!storeDomain) missingVars.push('SHOPIFY_STORE_DOMAIN')
    if (!accessToken) missingVars.push('SHOPIFY_ADMIN_TOKEN')
    throw new Error(`Configuration Shopify manquante: ${missingVars.join(', ')}`)
  }

  const url = `https://${storeDomain}/admin/api/${apiVersion}/${path}`
  console.log(`🔗 Shopify API call: ${method} ${url}`)
  
  // Nettoyer le cache expiré
  cleanExpiredCache()
  
  // Vérifier le cache pour les requêtes GET
  if (useCache && method === 'GET') {
    const cacheKey = generateCacheKey(url, { method, body })
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`📦 Cache hit: ${path}`)
      return {
        data: cached.data,
        headers: new Headers(),
        status: 200
      }
    }
  }

  // Appliquer le throttling
  const now = Date.now()
  const timeSinceLastCall = now - throttleState.lastCall
  
  // Si on a des informations sur l'utilisation du bucket, calculer le délai
  if (throttleState.currentUsage > 0) {
    const throttleDelay = calculateThrottleDelay(throttleState.currentUsage, throttleState.bucketSize)
    
    if (throttleDelay > 0) {
      console.log(`⏳ Throttling: ${throttleDelay}ms (usage: ${throttleState.currentUsage}/${throttleState.bucketSize})`)
      await sleep(throttleDelay)
    }
  }

  // Effectuer la requête avec retry
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const requestOptions: RequestInit = {
        method,
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      }

      const response = await fetch(url, requestOptions)
      
      // Mettre à jour l'état du throttling
      throttleState.lastCall = Date.now()
      throttleState.callCount++
      
      // Parser le header de limite d'appels
      const callLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit')
      const callLimit = parseCallLimit(callLimitHeader)
      
      if (callLimit) {
        throttleState.currentUsage = callLimit.current
        throttleState.bucketSize = callLimit.limit
      }

      // Gérer les erreurs 429
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const retryDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000
        
        console.log(`🚫 Rate limited (429), retry in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`)
        
        if (attempt < maxRetries) {
          await sleep(retryDelay)
          continue
        } else {
          throw new Error(`Rate limit exceeded after ${maxRetries} attempts`)
        }
      }

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ Shopify response: ${response.status} - ${JSON.stringify(data).length} chars`)
      
      // Mettre en cache pour les requêtes GET réussies
      if (useCache && method === 'GET') {
        const cacheKey = generateCacheKey(url, { method, body })
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: cacheTtl
        })
        console.log(`💾 Cached: ${path}`)
      }

      return {
        data,
        headers: response.headers,
        status: response.status
      }
      
    } catch (error) {
      lastError = error as Error
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error)
      
      if (attempt < maxRetries) {
        const backoffDelay = Math.pow(2, attempt) * 1000
        await sleep(backoffDelay)
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded')
}

/**
 * Pagination automatique pour les listes Shopify
 */
export async function shopifyFetchAllPages(
  path: string,
  options: {
    useCache?: boolean
    cacheTtl?: number
    maxRetries?: number
    pageSize?: number
  } = {}
): Promise<any[]> {
  const { pageSize = 250 } = options
  const allItems: any[] = []
  let nextPageInfo: string | null = null
  let pageCount = 0

  do {
    pageCount++
    const pagePath = nextPageInfo 
      ? `${path}?page_info=${nextPageInfo}&limit=${pageSize}`
      : `${path}?limit=${pageSize}`

    console.log(`📄 Fetching page ${pageCount}: ${pagePath}`)
    
    const response = await shopifyFetchWithThrottle(pagePath, 'GET', undefined, options)
    console.log(`📄 Page ${pageCount} response keys:`, Object.keys(response.data))
    const items = response.data[Object.keys(response.data)[0]] || []
    console.log(`📄 Page ${pageCount} items count:`, items.length)
    
    allItems.push(...items)
    
    // Vérifier s'il y a une page suivante
    const linkHeader = response.headers.get('Link')
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]+)[^>]*>;\s*rel="next"/)
      nextPageInfo = nextMatch ? nextMatch[1] : null
    } else {
      nextPageInfo = null
    }
    
    // Sécurité : limiter le nombre de pages
    if (pageCount > 100) {
      console.warn('⚠️ Maximum pages reached (100), stopping pagination')
      break
    }
    
  } while (nextPageInfo)

  console.log(`✅ Pagination complete: ${allItems.length} items across ${pageCount} pages`)
  return allItems
}

/**
 * Vide le cache manuellement
 */
export function clearShopifyCache(): void {
  cache.clear()
  console.log('🗑️ Shopify cache cleared')
}

/**
 * Obtient les statistiques du cache
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}

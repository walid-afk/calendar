import { createClient } from 'redis'

export const GOOGLE_TOKENS_KEY = 'google:tokens:default'

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

// Client Redis global
let redisClient: ReturnType<typeof createClient> | null = null

/**
 * Obtient le client Redis (singleton)
 */
async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      throw new Error('REDIS_URL environment variable is required')
    }

    redisClient = createClient({
      url: redisUrl
    })

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    await redisClient.connect()
    console.log('✅ Redis client connected')
  }

  return redisClient
}

/**
 * Export du client Redis pour les API routes
 */
export const redis = {
  async get(key: string): Promise<string | null> {
    const client = await getRedisClient()
    return await client.get(key)
  },
  async set(key: string, value: string): Promise<void> {
    const client = await getRedisClient()
    await client.set(key, value)
  },
  async del(key: string): Promise<void> {
    const client = await getRedisClient()
    await client.del(key)
  }
}

/**
 * Récupère les tokens Google depuis Redis
 */
export async function getTokens(): Promise<GoogleTokens | null> {
  try {
    const client = await getRedisClient()
    const tokensJson = await client.get(GOOGLE_TOKENS_KEY)
    
    if (!tokensJson) {
      console.log('⚠️  Aucun token Google trouvé dans Redis')
      return null
    }

    const tokens: GoogleTokens = JSON.parse(tokensJson)

    // Vérifier si le token n'est pas expiré
    if (tokens.expiry_date && Date.now() < tokens.expiry_date) {
      console.log('✅ Tokens Google récupérés depuis Redis (valides)')
      return tokens
    } else {
      console.log('⚠️  Token expiré, suppression de Redis')
      await deleteTokens()
      return null
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des tokens depuis Redis:', error)
    return null
  }
}

/**
 * Sauvegarde les tokens Google dans Redis
 */
export async function saveTokens(tokens: GoogleTokens): Promise<boolean> {
  try {
    const client = await getRedisClient()
    await client.set(GOOGLE_TOKENS_KEY, JSON.stringify(tokens))
    
    console.log('✅ Tokens Google sauvegardés dans Redis')
    console.log('Access token:', tokens.access_token ? 'Présent' : 'Manquant')
    console.log('Refresh token:', tokens.refresh_token ? 'Présent' : 'Manquant')
    console.log('Expiry date:', new Date(tokens.expiry_date).toLocaleString())
    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des tokens dans Redis:', error)
    return false
  }
}

/**
 * Supprime les tokens Google de Redis
 */
export async function deleteTokens(): Promise<boolean> {
  try {
    const client = await getRedisClient()
    await client.del(GOOGLE_TOKENS_KEY)
    console.log('✅ Tokens Google supprimés de Redis')
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression des tokens de Redis:', error)
    return false
  }
}

/**
 * Vérifie si des tokens valides existent
 */
export async function hasTokens(): Promise<boolean> {
  const tokens = await getTokens()
  if (!tokens) return false
  
  // Vérifier avec marge de 5 minutes
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000)
  return tokens.expiry_date > fiveMinutesFromNow
}

/**
 * Fonction de refresh des tokens
 */
export async function refreshTokens(refreshToken: string): Promise<GoogleTokens | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: refreshToken, // Garder le refresh_token existant
      scope: data.scope || 'https://www.googleapis.com/auth/calendar',
      token_type: data.token_type || 'Bearer',
      expiry_date: Date.now() + (data.expires_in * 1000),
    }
  } catch (error) {
    console.error('Erreur refresh tokens:', error)
    return null
  }
}

/**
 * Gère le refresh automatique des tokens
 */
export async function handleTokenRefresh(tokens: GoogleTokens): Promise<GoogleTokens | null> {
  console.log('🔄 Tentative de refresh des tokens...')
  try {
    const refreshedTokens = await refreshTokens(tokens.refresh_token)
    if (refreshedTokens) {
      await saveTokens(refreshedTokens)
      console.log('✅ Refresh des tokens réussi')
      return refreshedTokens
    }
  } catch (error) {
    console.error('❌ Échec du refresh des tokens:', error)
  }
  return null
}

/**
 * Ferme la connexion Redis
 */
export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    console.log('✅ Redis connection closed')
  }
}

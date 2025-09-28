export const GOOGLE_TOKENS_KEY = 'google:tokens:default'

export interface GoogleTokens {
  access_token: string
  refresh_token: string
  scope: string
  token_type: string
  expiry_date: number
}

// Stockage temporaire en mémoire pour le développement
let memoryTokens: GoogleTokens | null = null

/**
 * Récupère les tokens Google depuis la mémoire (mode développement)
 */
export async function getTokens(): Promise<GoogleTokens | null> {
  try {
    if (memoryTokens) {
      console.log('✅ Tokens Google récupérés depuis la mémoire')
      // Vérifier si le token n'est pas expiré
      if (memoryTokens.expiry_date && Date.now() < memoryTokens.expiry_date) {
        return memoryTokens
      } else {
        console.log('⚠️  Token expiré, suppression de la mémoire')
        memoryTokens = null
        return null
      }
    }
    
    console.log('⚠️  Aucun token Google en mémoire')
    return null
  } catch (error) {
    console.error('Erreur lors de la récupération des tokens:', error)
    return null
  }
}

/**
 * Sauvegarde les tokens Google en mémoire (mode développement)
 */
export async function saveTokens(tokens: GoogleTokens): Promise<boolean> {
  try {
    memoryTokens = tokens
    console.log('✅ Tokens Google sauvegardés en mémoire')
    console.log('Access token:', tokens.access_token ? 'Présent' : 'Manquant')
    console.log('Refresh token:', tokens.refresh_token ? 'Présent' : 'Manquant')
    console.log('Expiry date:', new Date(tokens.expiry_date).toLocaleString())
    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des tokens:', error)
    return false
  }
}

/**
 * Supprime les tokens Google de la mémoire
 */
export async function deleteTokens(): Promise<boolean> {
  try {
    memoryTokens = null
    console.log('✅ Tokens Google supprimés de la mémoire')
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression des tokens:', error)
    return false
  }
}

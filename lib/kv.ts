// Ce fichier est déprécié - utilisez lib/redis.ts à la place
// Gardé pour compatibilité mais redirige vers Redis

export { 
  getTokens, 
  saveTokens, 
  deleteTokens, 
  hasTokens, 
  refreshTokens, 
  handleTokenRefresh,
  GOOGLE_TOKENS_KEY,
  type GoogleTokens
} from './redis'
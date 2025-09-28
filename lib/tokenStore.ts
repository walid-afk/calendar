import fs from 'fs';
import path from 'path';

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

const TOKENS_FILE = process.env.NODE_ENV === 'production' 
  ? '/tmp/google_tokens.json' 
  : '.data/google_tokens.json';
const TOKENS_TMP = process.env.NODE_ENV === 'production' 
  ? '/tmp/google_tokens.json.tmp' 
  : '.data/google_tokens.json.tmp';

// Mémoire (variable module-level)
let memoryTokens: GoogleTokens | null = null;
let loaded = false;

// Créer le répertoire s'il n'existe pas (seulement en développement)
function ensureDataDir() {
  if (process.env.NODE_ENV !== 'production') {
    const dataDir = path.dirname(TOKENS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
}

// Fonction de refresh des tokens
async function refreshTokens(refreshToken: string): Promise<GoogleTokens | null> {
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
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: refreshToken, // Garder le refresh_token existant
      scope: data.scope || 'https://www.googleapis.com/auth/calendar',
      token_type: data.token_type || 'Bearer',
      expiry_date: Date.now() + (data.expires_in * 1000),
    };
  } catch (error) {
    console.error('Erreur refresh tokens:', error);
    return null;
  }
}

// Fonction async pour gérer le refresh automatique
async function handleTokenRefresh(tokens: GoogleTokens): Promise<GoogleTokens | null> {
  console.log('tokenStore.load.expired - tentative de refresh');
  try {
    const refreshedTokens = await refreshTokens(tokens.refresh_token);
    if (refreshedTokens) {
      setTokens(refreshedTokens);
      console.log('tokenStore.load.refresh.ok');
      return refreshedTokens;
    }
  } catch (error) {
    console.log('tokenStore.load.refresh.fail', error);
  }
  return null;
}

// Lecture au premier import (au boot)
function loadFromFile(): GoogleTokens | null {
  if (loaded) return memoryTokens;
  
  // Charger les tokens depuis le fichier
  try {
    ensureDataDir();
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf8');
      const tokens = JSON.parse(data);
      
      // Vérifier si on a un refresh_token
      if (tokens.refresh_token) {
        // Vérifier si le token est expiré (avec 2 min de marge)
        const now = Date.now();
        const expiryTime = tokens.expiry_date;
        
        if (now > expiryTime - 120000) { // 2 minutes avant expiration
          // Lancer le refresh en arrière-plan (sans bloquer)
          handleTokenRefresh(tokens).then(refreshedTokens => {
            if (refreshedTokens) {
              console.log('tokenStore.background.refresh.ok');
            }
          }).catch(error => {
            console.log('tokenStore.background.refresh.fail', error);
          });
          
          // Retourner les tokens existants pour l'instant
          console.log('tokenStore.load.expired - refresh en cours');
          memoryTokens = tokens;
          loaded = true;
          return tokens;
        } else {
          console.log('tokenStore.load.ok');
          memoryTokens = tokens;
          loaded = true;
          return tokens;
        }
      }
    }
  } catch (error) {
    console.log('tokenStore.load.error', error);
  }
  
  console.log('tokenStore.load.miss - reconnexion requise');
  loaded = true;
  return null;
}

// Écriture atomique (écrire .tmp puis rename)
function saveToFile(tokens: GoogleTokens): boolean {
  try {
    ensureDataDir();
    const content = JSON.stringify(tokens, null, 2);
    
    // Écriture atomique : .tmp puis rename
    fs.writeFileSync(TOKENS_TMP, content, 'utf8');
    fs.renameSync(TOKENS_TMP, TOKENS_FILE);
    
    console.log('tokenStore.save.ok');
    return true;
  } catch (error) {
    console.log('tokenStore.save.error', error);
    // Nettoyer le fichier temporaire en cas d'erreur
    try {
      if (fs.existsSync(TOKENS_TMP)) {
        fs.unlinkSync(TOKENS_TMP);
      }
    } catch (e) {
      // Ignorer les erreurs de nettoyage
    }
    return false;
  }
}

// API publique
export function getTokens(): GoogleTokens | null {
  if (!loaded) {
    return loadFromFile();
  }
  return memoryTokens;
}

export function setTokens(tokens: GoogleTokens): boolean {
  memoryTokens = tokens;
  return saveToFile(tokens);
}

export function hasTokens(): boolean {
  const tokens = getTokens();
  if (!tokens) return false;
  
  // Vérifier avec marge de 5 minutes
  const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
  return tokens.expiry_date > fiveMinutesFromNow;
}

export function clearTokens(): boolean {
  memoryTokens = null;
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
    }
    console.log('tokenStore.clear.ok');
    return true;
  } catch (error) {
    console.log('tokenStore.clear.error', error);
    return false;
  }
}

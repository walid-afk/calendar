import { NextRequest } from 'next/server'

/**
 * Vérifie le passcode dans les headers de la requête
 */
export function assertPasscode(req: NextRequest): void {
  const passcode = req.headers.get('x-passcode')
  const expectedPasscode = process.env.SHOP_PASSCODE || '1234'

  if (!passcode || passcode !== expectedPasscode) {
    throw new Error('Passcode invalide')
  }
}

/**
 * Middleware pour vérifier l'authentification
 */
export function withAuth(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      assertPasscode(req)
      return await handler(req)
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur d\'authentification' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
}

/**
 * Vérifie si l'utilisateur est authentifié (pour l'UI)
 */
export function isAuthenticated(passcode: string): boolean {
  const expectedPasscode = process.env.SHOP_PASSCODE || '1234'
  return passcode === expectedPasscode
}

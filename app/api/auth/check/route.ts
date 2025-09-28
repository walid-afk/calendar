import { NextRequest } from 'next/server'
import { assertPasscode } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    assertPasscode(req)
    return Response.json({ authenticated: true })
  } catch (error) {
    return Response.json(
      { authenticated: false, error: error instanceof Error ? error.message : 'Erreur d\'authentification' },
      { status: 401 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 401 }
      )
    }

    // Récupérer la session
    const sessionData = await redis.get(`session:${sessionId}`)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionData)

    // Vérifier l'expiration
    if (new Date(session.expiresAt) < new Date()) {
      await redis.del(`session:${sessionId}`)
      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 401 }
      )
    }

    // Récupérer l'utilisateur
    const userData = await redis.get(`user:${session.userId}`)
    if (!userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userData)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        preferences: user.preferences
      }
    })

  } catch (error) {
    console.error('Erreur lors de la vérification de session:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

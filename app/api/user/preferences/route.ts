import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function PUT(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')
    const { preferences } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 401 }
      )
    }

    // Vérifier la session
    const sessionData = await redis.get(`session:${sessionId}`)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionData)

    // Récupérer l'utilisateur
    const userData = await redis.get(`user:${session.userId}`)
    if (!userData) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userData)

    // Mettre à jour les préférences
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences
      }
    }

    // Sauvegarder
    await redis.set(`user:${user.email}`, JSON.stringify(updatedUser))
    await redis.set(`user:${user.id}`, JSON.stringify(updatedUser))

    return NextResponse.json({
      success: true,
      preferences: updatedUser.preferences
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 401 }
      )
    }

    // Vérifier la session
    const sessionData = await redis.get(`session:${sessionId}`)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session expirée' },
        { status: 401 }
      )
    }

    const session = JSON.parse(sessionData)

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
      preferences: user.preferences
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

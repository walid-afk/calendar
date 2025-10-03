import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { redis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const userData = await redis.get(`user:${email}`)
    if (!userData) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userData)

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Créer une session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session = {
      userId: user.id,
      email: user.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
    }

    await redis.set(`session:${sessionId}`, JSON.stringify(session))

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        preferences: user.preferences
      },
      sessionId
    })

  } catch (error) {
    console.error('Erreur lors de la connexion:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

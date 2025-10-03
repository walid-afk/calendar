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

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await redis.get(`user:${email}`)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const user = {
      id: userId,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      preferences: {
        calendarType: null,
        serviceSource: null,
        serviceConfig: null
      }
    }

    // Sauvegarder dans Redis
    await redis.set(`user:${email}`, JSON.stringify(user))
    await redis.set(`user:${userId}`, JSON.stringify(user))

    // Créer une session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const session = {
      userId,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours
    }

    await redis.set(`session:${sessionId}`, JSON.stringify(session))

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        preferences: user.preferences
      },
      sessionId
    })

  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

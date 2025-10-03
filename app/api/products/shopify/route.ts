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

    // Vérifier que l'utilisateur utilise Shopify
    if (user.preferences?.serviceSource !== 'shopify') {
      return NextResponse.json(
        { error: 'Source de service non configurée pour Shopify' },
        { status: 400 }
      )
    }

    // Récupérer les produits depuis le cache Redis
    const cacheKey = `products:${user.id}:shopify`
    const cachedDataString = await redis.get(cacheKey)
    
    if (!cachedDataString) {
      return NextResponse.json(
        { error: 'Aucun produit trouvé. Veuillez synchroniser d\'abord.' },
        { status: 404 }
      )
    }

    const cachedData = JSON.parse(cachedDataString)


    // Vérifier si la synchronisation est récente (moins de 24h)
    const lastSync = new Date(cachedData.lastSync)
    const now = new Date()
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)

    if (hoursSinceSync > 24) {
      return NextResponse.json({
        products: cachedData.products,
        count: cachedData.products.length,
        lastSync: cachedData.lastSync,
        warning: 'Données anciennes. Synchronisation recommandée.'
      })
    }

    return NextResponse.json({
      products: cachedData.products,
      count: cachedData.products.length,
      lastSync: cachedData.lastSync
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des produits Shopify:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

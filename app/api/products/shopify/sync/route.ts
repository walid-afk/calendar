import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')
    const { storeDomain, accessToken, collectionId } = await request.json()

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

    // Récupérer les produits depuis Shopify
    const shopifyUrl = `https://${storeDomain}/admin/api/2023-10/collections/${collectionId}/products.json`
    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des produits Shopify' },
        { status: 400 }
      )
    }

    const data = await response.json()
    const products = data.products || []

    // Transformer les produits pour notre format
    const transformedProducts = products.map((product: any) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      variants: product.variants.map((variant: any) => ({
        id: variant.id,
        title: variant.title,
        price: parseFloat(variant.price),
        duration: getVariantDuration(variant.id), // Utiliser la fonction existante
        sku: variant.sku,
        inventory_quantity: variant.inventory_quantity
      })),
      tags: product.tags,
      product_type: product.product_type,
      vendor: product.vendor,
      created_at: product.created_at,
      updated_at: product.updated_at
    }))

    // Sauvegarder dans Redis avec une clé unique par utilisateur
    const cacheKey = `products:${user.id}:shopify`
    await redis.set(cacheKey, JSON.stringify({
      products: transformedProducts,
      lastSync: new Date().toISOString(),
      storeDomain,
      collectionId
    }))

    // Mettre à jour les préférences utilisateur
    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        serviceSource: 'shopify',
        serviceConfig: {
          storeDomain,
          accessToken,
          collectionId
        }
      }
    }

    await redis.set(`user:${user.email}`, JSON.stringify(updatedUser))
    await redis.set(`user:${user.id}`, JSON.stringify(updatedUser))

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      count: transformedProducts.length,
      lastSync: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erreur lors de la synchronisation Shopify:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Fonction pour récupérer la durée d'une variante (utilise le mapping existant)
function getVariantDuration(variantId: string | number): number {
  // Import du mapping existant
  const variantDurations: Record<string, number> = {
    "47938306081112": 15, // Maillot Classique
    "47938306113880": 20, // Maillot Echancré
    "47938306146648": 25, // Maillot Semi-Intégral
    "47938306179416": 30, // Maillot Intégral
    "47938306212184": 30, // Cuisses
    "47938306244952": 30, // Demi-Jambes
    "47938306277720": 50, // Jambes Entières
    "47938306310488": 15, // Aisselles
    "47938306343256": 20, // Avant-Bras
    "47938306376024": 30, // Bras Entiers
    // ... autres mappings
  }
  
  const id = variantId.toString()
  return variantDurations[id] || 30 // Durée par défaut
}

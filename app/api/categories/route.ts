import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getAllCategories } from '@/lib/categories'

async function handler(req: NextRequest) {
  try {
    // Vérifier la configuration Shopify au début
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
    const accessToken = process.env.SHOPIFY_ADMIN_TOKEN
    
    if (!storeDomain || !accessToken) {
      const missingVars = []
      if (!storeDomain) missingVars.push('SHOPIFY_STORE_DOMAIN')
      if (!accessToken) missingVars.push('SHOPIFY_ADMIN_TOKEN')
      
      console.error('❌ Configuration Shopify manquante:', missingVars)
      return Response.json(
        { 
          error: 'Configuration Shopify manquante', 
          missing: missingVars,
          message: 'Vérifiez les variables d\'environnement SHOPIFY_STORE_DOMAIN et SHOPIFY_ADMIN_TOKEN'
        },
        { status: 500 }
      )
    }

    const categories = await getAllCategories()
    return Response.json({ items: categories })
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la récupération des catégories' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)

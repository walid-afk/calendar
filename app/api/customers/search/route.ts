import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { searchCustomers } from '@/lib/shopify'

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query) {
      return Response.json({ items: [] })
    }

    // Vraies données Shopify uniquement
    const customers = await searchCustomers(query)
    return Response.json({ items: customers })
  } catch (error) {
    console.error('Erreur Shopify:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la recherche de clients' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)

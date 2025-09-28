import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createCustomer, CreateCustomerData } from '@/lib/shopify'

async function handler(req: NextRequest) {
  try {
    const body: CreateCustomerData = await req.json()
    
    // Vraie création de client Shopify uniquement
    const newCustomer = await createCustomer(body)
    return Response.json(newCustomer)
  } catch (error) {
    console.error('Erreur Shopify:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la création du client' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)

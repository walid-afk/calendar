import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { listCalendarsFiltered } from '@/lib/google'

async function handler(req: NextRequest) {
  try {
    // Vraies données Google Calendar uniquement
    const calendars = await listCalendarsFiltered()
    return Response.json({ items: calendars })
  } catch (error) {
    console.error('Erreur Google Calendar:', error)
    
    // Si erreur d'authentification Google, retourner un code spécifique
    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === 'NO_GOOGLE_TOKENS' || error.code === 401)) {
      return Response.json(
        { error: 'google_not_connected' },
        { status: 401 }
      )
    }
    
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la récupération des employés' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)

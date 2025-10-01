import { NextRequest } from 'next/server'
import { getOAuth2 } from '@/lib/google'

export async function GET(req: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI
    
    console.log('Variables Google:')
    console.log('CLIENT_ID:', clientId ? 'Configuré' : 'Manquant')
    console.log('CLIENT_SECRET:', clientSecret ? 'Configuré' : 'Manquant')
    console.log('REDIRECT_URI:', redirectUri)
    
    if (!clientId || !clientSecret || !redirectUri) {
      return Response.json(
        { 
          error: 'Configuration Google manquante',
          details: {
            clientId: !!clientId,
            clientSecret: !!clientSecret,
            redirectUri: !!redirectUri
          }
        },
        { status: 500 }
      )
    }
    
    const oauth2 = await getOAuth2()
    
    const authUrl = oauth2.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      prompt: 'consent'
    })

    console.log('URL d\'authentification générée:', authUrl)
    return Response.redirect(authUrl)
  } catch (error) {
    console.error('Erreur Google Auth:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la génération de l\'URL d\'authentification' },
      { status: 500 }
    )
  }
}

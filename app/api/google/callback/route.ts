import { NextRequest } from 'next/server'
import { getOAuth2, saveTokensToStore } from '@/lib/google'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('Erreur OAuth:', error);
      return new Response(`Erreur d'autorisation: ${error}`, { status: 400 })
    }

    if (!code) {
      return new Response('Code d\'autorisation manquant', { status: 400 })
    }

    console.log('Échange du code OAuth pour obtenir les tokens...');
    const oauth2 = await getOAuth2()
    const { tokens } = await oauth2.getToken(code)

    if (!tokens) {
      console.error('Aucun token reçu de Google');
      return new Response('Impossible d\'obtenir les tokens', { status: 400 })
    }

    console.log('Tokens reçus, sauvegarde...');
    const success = await saveTokensToStore({
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      scope: tokens.scope!,
      token_type: tokens.token_type!,
      expiry_date: tokens.expiry_date!
    })

    if (!success) {
      console.error('Échec de la sauvegarde des tokens');
      return new Response('Erreur lors de la sauvegarde des tokens', { status: 500 })
    }

    console.log('Tokens sauvegardés avec succès');

    // PostMessage vers window.opener (popup) et fermeture
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Connexion Google réussie</title>
          <meta charset="utf-8">
        </head>
        <body>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'google-oauth-complete', ok: true }, '*');
              }
            } catch(e) {
              console.error('Erreur postMessage:', e);
            }
            // Fermer la popup après un court délai
            setTimeout(() => {
              try {
                window.close();
              } catch(e) {
                console.log('Impossible de fermer la fenêtre automatiquement');
              }
            }, 1000);
          </script>
          <div style="text-align: center; padding: 20px; font-family: Arial, sans-serif;">
            <h2>✅ Connexion Google réussie !</h2>
            <p>Cette fenêtre va se fermer automatiquement...</p>
            <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
              Si la fenêtre ne se ferme pas, vous pouvez la fermer manuellement.
            </p>
          </div>
        </body>
      </html>
    `
    
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (error) {
    console.error('Erreur lors du callback OAuth:', error)
    return new Response('Erreur lors de l\'authentification', { status: 500 })
  }
}

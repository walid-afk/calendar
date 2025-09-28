# Déploiement sur Vercel

## Configuration des variables d'environnement

Dans le dashboard Vercel, ajoutez ces variables d'environnement :

### Shopify
- `SHOPIFY_STORE_DOMAIN` : votre-domaine.myshopify.com
- `SHOPIFY_ADMIN_TOKEN` : votre token d'administration Shopify
- `SHOPIFY_API_VERSION` : 2025-07

### Google OAuth
- `GOOGLE_CLIENT_ID` : votre client ID Google
- `GOOGLE_CLIENT_SECRET` : votre client secret Google
- `GOOGLE_REDIRECT_URI` : https://votre-domaine.vercel.app/api/google/callback

### Timezone
- `DEFAULT_TZ` : Europe/Paris

## Étapes de déploiement

1. **Connecter le repository** à Vercel
2. **Configurer les variables d'environnement** dans le dashboard
3. **Mettre à jour Google OAuth** avec la nouvelle URL de callback
4. **Déployer** automatiquement

## Configuration Google OAuth

Mettre à jour l'URI de redirection dans Google Cloud Console :
- Ancien : `http://localhost:3000/api/google/callback`
- Nouveau : `https://votre-domaine.vercel.app/api/google/callback`

## Notes importantes

- Les tokens Google seront stockés dans le système de fichiers Vercel (temporaire)
- Pour la production, considérer l'utilisation d'une base de données pour la persistance
- Le fichier `vercel.json` configure un timeout de 30 secondes pour les API routes

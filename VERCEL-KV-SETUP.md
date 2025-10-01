# Configuration Vercel KV pour les tokens Google

## 1. Créer la base de données KV sur Vercel

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans l'onglet **Storage**
4. Cliquez sur **Create Database**
5. Choisissez **KV** (Key-Value)
6. Donnez un nom à votre base (ex: `calendar-tokens`)
7. Choisissez la région la plus proche
8. Cliquez sur **Create**

## 2. Récupérer les variables d'environnement

Après création, Vercel vous donnera :
- `KV_REST_API_URL` : URL de votre base KV
- `KV_REST_API_TOKEN` : Token d'authentification

## 3. Configurer les variables dans Vercel

1. Dans votre projet Vercel, allez dans **Settings** > **Environment Variables**
2. Ajoutez les variables suivantes :

```
KV_REST_API_URL=https://your-kv-database-url.upstash.io
KV_REST_API_TOKEN=your_kv_rest_api_token
```

## 4. Configuration locale (optionnel)

Pour le développement local, ajoutez ces variables dans votre `.env.local` :

```bash
KV_REST_API_URL=https://your-kv-database-url.upstash.io
KV_REST_API_TOKEN=your_kv_rest_api_token
```

## 5. Test de la configuration

Une fois configuré, les tokens Google seront automatiquement stockés dans Vercel KV au lieu du système de fichiers temporaire.

### Avantages de Vercel KV :
- ✅ **Persistance** : Les tokens survivent aux redéploiements
- ✅ **Performance** : Accès rapide depuis toutes les régions
- ✅ **Fiabilité** : Base de données Redis gérée
- ✅ **Sécurité** : Chiffrement en transit et au repos

### Migration automatique :
Le code a été modifié pour utiliser Vercel KV par défaut. Aucune action supplémentaire n'est requise une fois les variables d'environnement configurées.

## 6. Vérification

Pour vérifier que tout fonctionne :

1. Connectez-vous à Google via l'interface
2. Vérifiez les logs Vercel pour voir les messages de sauvegarde KV
3. Redéployez l'application - la connexion Google devrait persister

## 7. Commandes utiles

```bash
# Voir les logs de déploiement
vercel logs

# Vérifier les variables d'environnement
vercel env ls

# Redéployer avec les nouvelles variables
vercel --prod
```

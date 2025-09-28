# Interface Employés RDV (Vercel + Google + Shopify)

Application Next.js 14 pour la gestion des rendez-vous avec intégration Google Calendar et Shopify.

## 🚀 Déploiement sur Vercel

### 1. Configuration des variables d'environnement

Créez ces variables dans votre projet Vercel :

```bash
# Accès employé
SHOP_PASSCODE=xxxx

# Shopify
SHOPIFY_STORE_DOMAIN=ma-boutique.myshopify.com
SHOPIFY_ADMIN_TOKEN=shpat_xxx
SHOPIFY_PRESTATIONS_COLLECTION_HANDLE=prestations
SHOPIFY_DURATION_METAFIELD=custom.duration_minutes

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL=https://<ton-domaine-ou-vercel-app>/api/google/callback

# Slots & règles
DEFAULT_OPENING=09:00-19:00
SLOT_STEP_MINUTES=15
MIN_LEAD_MINUTES=60
POST_BOOK_BUFFER_MINUTES=5
DEFAULT_TZ=Europe/Paris

# Filtrage des agendas (employés)
CALENDAR_ACCESS_ROLES=owner,writer
CALENDAR_INCLUDE_DOMAIN=@tondomaine.com
CALENDAR_EXCLUDE_SUMMARY_REGEX=^US Holidays

# Vercel KV
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

### 2. Configuration Vercel KV

1. Allez dans votre projet Vercel
2. Onglet "Storage" > "KV"
3. Créez une base de données KV
4. Copiez l'URL et le token dans les variables d'environnement

### 3. Configuration Google OAuth

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un projet ou sélectionnez-en un
3. Activez l'API Google Calendar
4. Créez des identifiants OAuth 2.0
5. Ajoutez votre domaine Vercel dans les domaines autorisés
6. Configurez l'URL de redirection : `https://<votre-domaine>/api/google/callback`

### 4. Configuration Shopify

1. Créez une application privée dans votre admin Shopify
2. Activez les permissions :
   - `read_products`
   - `read_customers`
   - `write_customers`
   - `read_product_listings`
3. Créez une collection "prestations" avec vos services
4. Ajoutez un métachamp `custom.duration_minutes` sur vos produits

## 🛠️ Installation locale

```bash
# Cloner le projet
git clone <votre-repo>
cd calendar-shopify

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Configurer les variables d'environnement dans .env.local

# Lancer en développement
npm run dev
```

## 📱 Utilisation

1. **Connexion** : Accédez à `/employe` et entrez le code d'accès
2. **Authentification Google** : Cliquez sur "Connecter Google" pour autoriser l'accès aux calendriers
3. **Sélection employé** : Choisissez l'employé dans la liste déroulante
4. **Date** : Sélectionnez la date du rendez-vous
5. **Prestations** : Ajoutez les services depuis la liste
6. **Client** : Recherchez ou créez une nouvelle cliente
7. **Créneaux** : Sélectionnez un créneau disponible dans la grille
8. **Réservation** : Cliquez sur "Réserver le créneau"

## 🔧 Fonctionnalités

- ✅ Authentification par passcode
- ✅ Intégration Google Calendar OAuth
- ✅ Gestion des employés (calendriers filtrés)
- ✅ Sélection de créneaux avec contraintes
- ✅ Gestion des prestations Shopify
- ✅ Recherche et création de clients
- ✅ Réservation avec vérification anti-conflit
- ✅ Interface responsive avec Polaris
- ✅ Gestion des fuseaux horaires
- ✅ Lead time et buffer configurable

## 🎯 Règles métier

- **Lead time** : Impossible de réserver moins de 60 minutes à l'avance
- **Buffer** : 5 minutes de buffer après chaque rendez-vous
- **Heures d'ouverture** : 9h-19h par défaut
- **Durée des créneaux** : 15 minutes par défaut
- **Fuseau horaire** : Europe/Paris

## 🐛 Dépannage

### Erreur "Tokens Google non trouvés"
- Vérifiez que l'authentification Google a bien été effectuée
- Vérifiez la configuration OAuth dans Google Cloud Console

### Erreur "Collection non trouvée"
- Vérifiez que la collection "prestations" existe dans Shopify
- Vérifiez la variable `SHOPIFY_PRESTATIONS_COLLECTION_HANDLE`

### Erreur "Passcode invalide"
- Vérifiez la variable `SHOP_PASSCODE` dans Vercel
- Assurez-vous que le code saisi correspond exactement

## 📝 Structure du projet

```
app/
├── api/                    # Routes API
│   ├── auth/check/
│   ├── employees/
│   ├── google/auth/
│   ├── google/callback/
│   ├── freebusy/
│   ├── products/
│   ├── customers/
│   └── book/
├── components/             # Composants UI
├── employe/               # Page principale
├── layout.tsx
└── globals.css

lib/                       # Librairies utilitaires
├── auth.ts
├── google.ts
├── kv.ts
├── shopify.ts
├── slots.ts
└── time.ts
```

## 🔒 Sécurité

- Toutes les routes API sont protégées par passcode
- Les tokens Google sont stockés de manière sécurisée dans Vercel KV
- Aucun secret n'est exposé côté client
- Vérification anti-conflit avant chaque réservation

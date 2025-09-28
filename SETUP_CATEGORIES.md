# Configuration des Catégories Shopify

## Vue d'ensemble

Ce document décrit la configuration des 5 catégories principales (collections Shopify) et de leurs sous-catégories pour l'application de réservation.

## Collections Principales

Les 5 collections Shopify configurées :

1. **Épilation** (ID: 666821853528)
   - Sous-catégories : Haute fréquence, IPL, Cire
   
2. **Mains & Pieds** (ID: 666821886296)
   - Sous-catégories : Mains, Pieds
   
3. **Soins corps** (ID: 666822017368)
   - Sous-catégories : Aucune
   
4. **Soin visage** (ID: 666822148440)
   - Sous-catégories : Aucune
   
5. **Maquillage & Teinture** (ID: 666822213976)
   - Sous-catégories : Maquillage, Teinture

## Métachamps Configurés

### Produits
- `custom.subcategory` : Sous-catégorie du produit
- `custom.area` : Zones du corps concernées (liste)
- `custom.duration_minutes` : Durée par défaut en minutes
- `custom.price_from` : Prix à partir de
- `custom.short_description` : Description courte

### Variantes
- `custom.duration_minutes` : Durée spécifique de la variante
- `custom.price_from` : Prix spécifique de la variante
- `custom.area` : Zone spécifique de la variante

## Tags Automatiques

Chaque produit dans une collection reçoit automatiquement :
- `cat:<handle-collection>` (ex: `cat:epilation`)
- `sub:<handle-sous-categorie>` (ex: `sub:haute-frequence`)
- `zone:<handle-zone>` (ex: `zone:jambe`)

## Sous-collections Créées

Pour chaque catégorie avec sous-catégories, des sous-collections automatiques sont créées :

### Épilation
- `epilation-haute-frequence`
- `epilation-ipl`
- `epilation-cire`

### Mains & Pieds
- `mains-pieds-mains`
- `mains-pieds-pieds`

### Maquillage & Teinture
- `maquillage-teinture-maquillage`
- `maquillage-teinture-teinture`

## Filtres Search & Discovery

Pour chaque collection, les filtres suivants sont configurés :
- **Sous-catégorie** : Filtre par tags `sub:*`
- **Zone** : Filtre par tags `zone:*`
- **Durée** : Filtre par métachamp `custom.duration_minutes`
- **Prix** : Filtre par métachamp `custom.price_from`

## Navigation

Le menu principal est mis à jour avec :
- 5 catégories principales
- Sous-menus pour les catégories avec sous-catégories
- Liens vers les collections et sous-collections

## Intégration App RDV

L'application de réservation inclut :
- Filtre par catégorie (collection ID)
- Filtre par sous-catégorie
- Filtre par zone
- Rechargement automatique des services selon les filtres

## Scripts de Configuration

### 1. Configuration des catégories
```bash
node scripts/setup-categories.js
```

### 2. Mise à jour de la navigation
```bash
node scripts/update-navigation.js
```

### 3. Configuration des filtres
```bash
node scripts/setup-filters.js
```

## Variables d'Environnement Requises

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_TOKEN=your-admin-token
SHOPIFY_API_VERSION=2023-10
SHOP_PASSCODE=your-passcode
```

## Zones Disponibles

- **Corps** : jambe, bras, aisselles, maillot, dos, ventre
- **Visage** : visage, sourcils, levres, yeux
- **Extrémités** : mains, pieds, ongles

## Validation et Tests

1. Vérifier que les 5 collections existent et sont publiées
2. Tester les sous-collections automatiques
3. Valider les filtres sur les pages de collection
4. Tester le filtrage dans l'app RDV
5. Vérifier la navigation mise à jour

## Maintenance

- Les tags sont synchronisés automatiquement
- Les sous-collections se mettent à jour selon les règles
- Les filtres restent actifs sur les collections
- La navigation reflète les changements de collections

# Configuration du Mapping des Produits

## Structure du Mapping

Le mapping des produits est défini dans `lib/category-mapping.ts` dans la constante `CATEGORY_MAP`.

### Format

```typescript
export const CATEGORY_MAP: CategoryMap = {
  epilation: {
    collectionId: '666821853528',
    subcategories: {
      'ipl': {
        label: 'IPL',
        productIds: ['9067411243352']
      },
      'cire': {
        label: 'Cire',
        productIds: ['6760974254137', '6730971938873', '8349424976216', '6730975117369']
      },
      'haute-frequence': {
        label: 'Haute fréquence',
        productIds: ['9067382866264']
      }
    }
  }
  // Ajouter d'autres catégories ici...
}
```

## Ajouter une Nouvelle Catégorie

1. **Ouvrir** `lib/category-mapping.ts`
2. **Ajouter** une nouvelle entrée dans `CATEGORY_MAP` :

```typescript
mains-pieds: {
  collectionId: '666821886296',
  subcategories: {
    'mains': {
      label: 'Mains',
      productIds: ['ID_PRODUIT_1', 'ID_PRODUIT_2']
    },
    'pieds': {
      label: 'Pieds',
      productIds: ['ID_PRODUIT_3', 'ID_PRODUIT_4']
    }
  }
}
```

## Ajouter une Nouvelle Sous-catégorie

1. **Ouvrir** `lib/category-mapping.ts`
2. **Ajouter** la sous-catégorie dans la catégorie existante :

```typescript
epilation: {
  collectionId: '666821853528',
  subcategories: {
    // ... sous-catégories existantes ...
    'nouvelle-sous-categorie': {
      label: 'Nouvelle Sous-catégorie',
      productIds: ['ID_PRODUIT_1', 'ID_PRODUIT_2']
    }
  }
}
```

## Ajouter des Produits

1. **Ouvrir** `lib/category-mapping.ts`
2. **Ajouter** les IDs produits dans le tableau `productIds` :

```typescript
'ipl': {
  label: 'IPL',
  productIds: ['9067411243352', 'NOUVEAU_ID_PRODUIT']
}
```

## Récupérer les IDs Produits

1. **Aller** dans Shopify Admin
2. **Ouvrir** le produit
3. **Copier** l'ID depuis l'URL : `/admin/products/ID_PRODUIT`

## Catégories sans Sous-catégories

Pour les catégories sans sous-catégories (ex: Soins Corps, Soins Visage), utiliser une sous-catégorie spéciale :

```typescript
soins-corps: {
  collectionId: '666822017368',
  subcategories: {
    'all': {
      label: 'Tous les soins',
      productIds: ['ID_1', 'ID_2', 'ID_3']
    }
  }
}
```

## Validation

Après modification :
1. **Redémarrer** le serveur de développement
2. **Tester** dans l'interface `/employe`
3. **Vérifier** que les produits s'affichent correctement

## Debug

Ajouter `&debug=1` à l'URL pour voir les métadonnées :
- `http://localhost:3000/api/products/select-data?categoryHandle=epilation&subcategoryHandle=ipl&debug=1`

/**
 * Mapping statique extensible des catégories et sous-catégories
 * Source de vérité pour les produits autorisés par sous-catégorie
 */

export interface CategoryMapping {
  collectionId: string
  subcategories: {
    [subcategoryHandle: string]: {
      label: string
      productIds: string[]
    }
  }
}

export interface CategoryMap {
  [categoryHandle: string]: CategoryMapping
}

// Mapping statique extensible
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
  },
  'Mains Et Pieds': {
    collectionId: '666821886296',
    subcategories: {
      'mains': {
        label: 'Mains',
        productIds: ['6730928324665', '6799196487737', '6817429192761', '6808328732729']
      },
      'pieds': {
        label: 'Pieds',
        productIds: ['6730933862457', '6730934550585']
      }
    }
  },
  'Maquillage Et Teinture': {
    collectionId: '666822213976',
    subcategories: {
      'maquillage': {
        label: 'Maquillage',
        productIds: ['6799196061753', '6799196028985']
      },
      'teinture': {
        label: 'Teinture',
        productIds: ['6731080826937', '6731081580601', '6731084529721']
      }
    }
  },
  'Soins Visage': {
    collectionId: '666822148440',
    subcategories: {
      'all': {
        label: 'Tous les soins',
        productIds: ['6730945232953', '6730965450809', '6799170240569', '9027713663320', '6799170142265', '6799196520505', '9027715989848', '6730633576505', '6730949886009', '6730941268025', '6974824775737', '6730943397945', '9236075184472']
      }
    }
  },
  'Soins Corps': {
    collectionId: '666822017368',
    subcategories: {
      'all': {
        label: 'Tous les soins',
        productIds: ['6799170863161', '6799196323897', '6888992669753', '8782755365208', '6811796013113', '6960041132089', '6799195897913', '6730959224889', '6799197700153']
      }
    }
  }
}

/**
 * Récupère toutes les catégories disponibles
 */
export function getAllCategories(): Array<{ handle: string; label: string; collectionId: string }> {
  return Object.entries(CATEGORY_MAP).map(([handle, mapping]) => ({
    handle,
    label: handle.charAt(0).toUpperCase() + handle.slice(1).replace('-', ' '),
    collectionId: mapping.collectionId
  }))
}

/**
 * Récupère les sous-catégories d'une catégorie
 */
export function getSubcategoriesForCategory(categoryHandle: string): Array<{ handle: string; label: string }> {
  const category = CATEGORY_MAP[categoryHandle]
  if (!category) return []
  
  return Object.entries(category.subcategories).map(([handle, subcategory]) => ({
    handle,
    label: subcategory.label
  }))
}

/**
 * Normalise une clé de sous-catégorie (kebab-case, sans accent, sans espace)
 */
export function normalizeSubcategoryHandle(handle: string): string {
  return handle
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Récupère les IDs produits d'une sous-catégorie
 */
export function getProductIdsForSubcategory(categoryHandle: string, subcategoryHandle: string): string[] {
  const category = CATEGORY_MAP[categoryHandle]
  if (!category) {
    console.log(`❌ Catégorie "${categoryHandle}" non trouvée dans le mapping`)
    return []
  }
  
  // Normaliser la clé de sous-catégorie
  const normalizedHandle = normalizeSubcategoryHandle(subcategoryHandle)
  console.log(`🔍 Recherche sous-catégorie: "${subcategoryHandle}" → "${normalizedHandle}"`)
  
  // Chercher avec la clé normalisée
  const subcategory = category.subcategories[normalizedHandle]
  if (!subcategory) {
    console.log(`❌ Sous-catégorie "${normalizedHandle}" non trouvée dans la catégorie "${categoryHandle}"`)
    console.log(`📋 Sous-catégories disponibles:`, Object.keys(category.subcategories))
    return []
  }
  
  console.log(`✅ Sous-catégorie "${normalizedHandle}" trouvée:`, subcategory.productIds)
  return subcategory.productIds
}

/**
 * Récupère tous les IDs produits d'une catégorie (toutes sous-catégories)
 */
export function getAllProductIdsForCategory(categoryHandle: string): string[] {
  const category = CATEGORY_MAP[categoryHandle]
  if (!category) return []
  
  const allProductIds: string[] = []
  Object.values(category.subcategories).forEach(subcategory => {
    allProductIds.push(...subcategory.productIds)
  })
  
  return allProductIds
}

/**
 * Vérifie si une catégorie existe
 */
export function categoryExists(categoryHandle: string): boolean {
  return categoryHandle in CATEGORY_MAP
}

/**
 * Vérifie si une sous-catégorie existe pour une catégorie
 */
export function subcategoryExists(categoryHandle: string, subcategoryHandle: string): boolean {
  const category = CATEGORY_MAP[categoryHandle]
  if (!category) return false
  
  return subcategoryHandle in category.subcategories
}

/**
 * Récupère le label d'une sous-catégorie
 */
export function getSubcategoryLabel(categoryHandle: string, subcategoryHandle: string): string | null {
  const category = CATEGORY_MAP[categoryHandle]
  if (!category) return null
  
  const subcategory = category.subcategories[subcategoryHandle]
  if (!subcategory) return null
  
  return subcategory.label
}

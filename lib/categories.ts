// Configuration des catégories Shopify
export const CATEGORY_IDS = [
  '666821853528',
  '666821886296', 
  '666822017368',
  '666822148440',
  '666822213976'
];

export const SUBCATEGORIES = {
  'epilation': ['Haute fréquence', 'IPL', 'Cire'],
  'mains-pieds': ['Mains', 'Pieds'],
  'soins-corps': [],
  'soins-visage': [],
  'maquillage-teinture': ['Maquillage', 'Teinture']
};

export const ZONES = [
  'jambe', 'bras', 'aisselles', 'maillot', 'visage', 'dos', 'ventre', 
  'pieds', 'mains', 'ongles', 'sourcils', 'levres', 'yeux'
];

export interface Category {
  id: string;
  title: string;
  handle: string;
  published: boolean;
  subcategories: string[];
}

export interface ProductWithCategory {
  id: number;
  title: string;
  price: string;
  durationMinutes: number;
  collectionId: string;
  subcategory?: string;
  areas: string[];
  tags: string[];
  metafields?: any[];
  variants?: any[];
}

export interface CategoryFilter {
  collectionId?: string;
  subcategory?: string;
  area?: string;
  tags?: string[];
}

/**
 * Récupère les produits d'une collection avec filtrage
 */
export async function getProductsByCategory(
  collectionId: string,
  filters: CategoryFilter = {}
): Promise<ProductWithCategory[]> {
  try {
    const { getProductsByCollectionId } = await import('./shopify');
    const products = await getProductsByCollectionId(parseInt(collectionId));
    
    // Convertir les produits Shopify en ProductWithCategory
    const productsWithCategory: ProductWithCategory[] = products.map(product => ({
      ...product,
      collectionId,
      areas: [], // À implémenter selon les métafields
      tags: [] // À implémenter selon les tags Shopify
    }));
    
    let filteredProducts = productsWithCategory;
    
    // Filtrer par sous-catégorie
    if (filters.subcategory) {
      filteredProducts = filteredProducts.filter(product => 
        product.tags.includes(`sub:${filters.subcategory}`)
      );
    }
    
    // Filtrer par zone
    if (filters.area) {
      filteredProducts = filteredProducts.filter(product => 
        product.areas.includes(filters.area!) ||
        product.tags.includes(`zone:${filters.area}`)
      );
    }
    
    // Filtrer par tags
    if (filters.tags && filters.tags.length > 0) {
      filteredProducts = filteredProducts.filter(product => 
        filters.tags!.some(tag => product.tags.includes(tag))
      );
    }
    
    return filteredProducts;
  } catch (error) {
    console.error('Erreur lors du filtrage par catégorie:', error);
    return [];
  }
}

/**
 * Récupère le titre d'une catégorie par son ID
 */
function getCategoryTitleById(id: string): string {
  const titles: Record<string, string> = {
    '666821853528': 'Épilation',
    '666821886296': 'Mains & Pieds',
    '666822017368': 'Soins corps',
    '666822148440': 'Soin visage',
    '666822213976': 'Maquillage & Teinture'
  };
  return titles[id] || 'Catégorie inconnue';
}

/**
 * Récupère toutes les catégories avec leurs sous-catégories
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const categories: Category[] = [];
    
    for (const id of CATEGORY_IDS) {
      try {
        // Pour l'instant, utiliser des données statiques
        const categoryTitle = getCategoryTitleById(id);
        const categoryHandle = categoryTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        categories.push({
          id: id,
          title: categoryTitle,
          handle: categoryHandle,
          published: true,
          subcategories: SUBCATEGORIES[categoryHandle as keyof typeof SUBCATEGORIES] || []
        });
      } catch (error) {
        console.error(`Erreur collection ${id}:`, error);
      }
    }
    
    return categories;
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return [];
  }
}

/**
 * Récupère les sous-catégories d'une catégorie
 */
export function getSubcategoriesForCategory(categoryHandle: string): string[] {
  return SUBCATEGORIES[categoryHandle as keyof typeof SUBCATEGORIES] || [];
}

/**
 * Récupère les zones disponibles pour une sous-catégorie
 */
export function getZonesForSubcategory(subcategory: string): string[] {
  const zoneMapping: Record<string, string[]> = {
    'haute-frequence': ['visage', 'dos', 'ventre'],
    'ipl': ['jambe', 'bras', 'aisselles', 'maillot'],
    'cire': ['jambe', 'bras', 'aisselles', 'maillot', 'sourcils'],
    'mains': ['mains', 'ongles'],
    'pieds': ['pieds', 'ongles'],
    'maquillage': ['visage', 'yeux', 'levres'],
    'teinture': ['sourcils', 'levres']
  };
  
  return zoneMapping[subcategory] || ZONES;
}

/**
 * Valide qu'un produit appartient à une catégorie
 */
export function validateProductCategory(product: ProductWithCategory, categoryId: string): boolean {
  return product.collectionId === categoryId;
}

/**
 * Valide qu'un produit a les tags requis
 */
export function validateProductTags(product: ProductWithCategory, requiredTags: string[]): boolean {
  return requiredTags.every(tag => product.tags.includes(tag));
}

/**
 * Formate le nom d'une sous-catégorie pour l'affichage
 */
export function formatSubcategoryName(subcategory: string): string {
  return subcategory
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formate le nom d'une zone pour l'affichage
 */
export function formatZoneName(zone: string): string {
  return zone
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

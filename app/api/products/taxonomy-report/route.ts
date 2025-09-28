import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getPrestationsProducts } from '@/lib/shopify'
import { getProductWithTaxonomy } from '@/lib/taxonomy'
import { getCacheStats } from '@/lib/shopify-throttle'

interface TaxonomyReport {
  categories: Record<string, {
    count: number
    subcategories: Record<string, number>
    productsWithoutCategory: number[]
  }>
  totalProducts: number
  productsWithoutSoinCategory: number[]
}

async function handler(req: NextRequest) {
  try {
    console.log('📊 Génération du rapport de taxonomie...')
    
    // Récupérer tous les produits
    const allProducts = await getPrestationsProducts()
    const report: TaxonomyReport = {
      categories: {},
      totalProducts: allProducts.length,
      productsWithoutSoinCategory: []
    }
    
    // Analyser chaque produit
    for (const product of allProducts) {
      try {
        const productWithTaxonomy = await getProductWithTaxonomy(product.id)
        if (!productWithTaxonomy) {
          report.productsWithoutSoinCategory.push(product.id)
          continue
        }
        
        // Produits sans soin_category
        if (!productWithTaxonomy.soin_category) {
          report.productsWithoutSoinCategory.push(product.id)
          continue
        }
        
        const category = productWithTaxonomy.soin_category
        
        // Initialiser la catégorie si nécessaire
        if (!report.categories[category]) {
          report.categories[category] = {
            count: 0,
            subcategories: {},
            productsWithoutCategory: []
          }
        }
        
        // Compter le produit dans la catégorie
        report.categories[category].count++
        
        // Gérer les sous-catégories
        if (productWithTaxonomy.subcategory) {
          const subcategory = productWithTaxonomy.subcategory
          if (!report.categories[category].subcategories[subcategory]) {
            report.categories[category].subcategories[subcategory] = 0
          }
          report.categories[category].subcategories[subcategory]++
        } else {
          // Produit sans sous-catégorie
          report.categories[category].productsWithoutCategory.push(product.id)
        }
        
      } catch (error) {
        console.error(`Erreur analyse produit ${product.id}:`, error)
        report.productsWithoutSoinCategory.push(product.id)
      }
    }
    
    // Calculer les statistiques globales
    const totalWithCategory = Object.values(report.categories).reduce((sum, cat) => sum + cat.count, 0)
    const totalSubcategories = Object.values(report.categories).reduce((sum, cat) => 
      sum + Object.keys(cat.subcategories).length, 0
    )
    
    const summary = {
      totalProducts: report.totalProducts,
      productsWithCategory: totalWithCategory,
      productsWithoutCategory: report.productsWithoutSoinCategory.length,
      totalCategories: Object.keys(report.categories).length,
      totalSubcategories,
      categories: Object.entries(report.categories).map(([name, data]) => ({
        name,
        count: data.count,
        subcategories: Object.entries(data.subcategories).map(([subName, subCount]) => ({
          name: subName,
          count: subCount
        })),
        productsWithoutSubcategory: data.productsWithoutCategory.length
      }))
    }
    
    return Response.json({
      summary,
      details: report,
      generatedAt: new Date().toISOString(),
      cacheStats: getCacheStats()
    })
    
  } catch (error) {
    console.error('Erreur génération rapport taxonomie:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}

export const GET = withAuth(handler)

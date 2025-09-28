const fetch = require('node-fetch');

// Configuration
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2023-10';

const CATEGORY_IDS = [
  '666821853528',
  '666821886296', 
  '666822017368',
  '666822148440',
  '666822213976'
];

// Mapping des sous-catégories par défaut
const SUBCATEGORIES = {
  'epilation': ['haute-frequence', 'ipl', 'cire'],
  'mains-pieds': ['mains', 'pieds'],
  'soins-corps': [],
  'soin-visage': [],
  'maquillage-teinture': ['maquillage', 'teinture']
};

// Zones communes
const ZONES = [
  'jambe', 'bras', 'aisselles', 'maillot', 'visage', 'dos', 'ventre', 
  'pieds', 'mains', 'ongles', 'sourcils', 'levres', 'yeux'
];

async function shopifyRequest(endpoint, method = 'GET', body = null) {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;
  const options = {
    method,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function resolveCollections() {
  console.log('🔍 Résolution des collections...');
  const collections = {};
  
  for (const id of CATEGORY_IDS) {
    try {
      const data = await shopifyRequest(`collections/${id}.json`);
      const collection = data.collection;
      
      collections[id] = {
        title: collection.title,
        handle: collection.handle,
        published: collection.published_at !== null,
        rules: collection.rules || []
      };
      
      console.log(`✅ ${collection.title} (${collection.handle}) - ${collection.published_at ? 'Publiée' : 'Cachée'}`);
    } catch (error) {
      console.error(`❌ Erreur collection ${id}:`, error.message);
    }
  }
  
  return collections;
}

async function createMetafields() {
  console.log('📝 Création des métachamps...');
  
  // Métachamps produits
  const productMetafields = [
    {
      namespace: 'custom',
      key: 'subcategory',
      type: 'single_line_text_field',
      description: 'Sous-catégorie du produit'
    },
    {
      namespace: 'custom', 
      key: 'area',
      type: 'list.single_line_text_field',
      description: 'Zones du corps concernées'
    },
    {
      namespace: 'custom',
      key: 'duration_minutes',
      type: 'number_integer',
      description: 'Durée par défaut en minutes'
    },
    {
      namespace: 'custom',
      key: 'price_from',
      type: 'number_decimal',
      description: 'Prix à partir de'
    },
    {
      namespace: 'custom',
      key: 'short_description',
      type: 'multi_line_text_field',
      description: 'Description courte'
    }
  ];
  
  // Métachamps variantes
  const variantMetafields = [
    {
      namespace: 'custom',
      key: 'duration_minutes',
      type: 'number_integer',
      description: 'Durée spécifique de la variante'
    },
    {
      namespace: 'custom',
      key: 'price_from',
      type: 'number_decimal',
      description: 'Prix spécifique de la variante'
    },
    {
      namespace: 'custom',
      key: 'area',
      type: 'single_line_text_field',
      description: 'Zone spécifique de la variante'
    }
  ];
  
  // Créer les métachamps produits
  for (const metafield of productMetafields) {
    try {
      await shopifyRequest('metafields.json', 'POST', {
        metafield: {
          ...metafield,
          owner_resource: 'product'
        }
      });
      console.log(`✅ Métachamp produit: ${metafield.namespace}.${metafield.key}`);
    } catch (error) {
      console.log(`⚠️  Métachamp produit ${metafield.key} existe déjà ou erreur:`, error.message);
    }
  }
  
  // Créer les métachamps variantes
  for (const metafield of variantMetafields) {
    try {
      await shopifyRequest('metafields.json', 'POST', {
        metafield: {
          ...metafield,
          owner_resource: 'variant'
        }
      });
      console.log(`✅ Métachamp variante: ${metafield.namespace}.${metafield.key}`);
    } catch (error) {
      console.log(`⚠️  Métachamp variante ${metafield.key} existe déjà ou erreur:`, error.message);
    }
  }
}

async function syncProductTags(collections) {
  console.log('🏷️  Synchronisation des tags produits...');
  
  for (const [collectionId, collection] of Object.entries(collections)) {
    try {
      // Récupérer tous les produits de la collection
      const productsData = await shopifyRequest(`collections/${collectionId}/products.json?limit=250`);
      const products = productsData.products || [];
      
      console.log(`📦 ${products.length} produits dans ${collection.title}`);
      
      for (const product of products) {
        const requiredTag = `cat:${collection.handle}`;
        const currentTags = product.tags ? product.tags.split(', ') : [];
        
        if (!currentTags.includes(requiredTag)) {
          const newTags = [...currentTags, requiredTag];
          
          try {
            await shopifyRequest(`products/${product.id}.json`, 'PUT', {
              product: {
                id: product.id,
                tags: newTags.join(', ')
              }
            });
            console.log(`✅ Tag ajouté: ${requiredTag} sur ${product.title}`);
          } catch (error) {
            console.error(`❌ Erreur tag ${product.title}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erreur collection ${collection.title}:`, error.message);
    }
  }
}

async function createSubcollections(collections) {
  console.log('📁 Création des sous-collections...');
  
  for (const [collectionId, collection] of Object.entries(collections)) {
    const subcategories = SUBCATEGORIES[collection.handle] || [];
    
    for (const subcategory of subcategories) {
      const subcollectionHandle = `${collection.handle}-${subcategory}`;
      const subcollectionTitle = `${collection.title} — ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}`;
      
      try {
        // Vérifier si la sous-collection existe déjà
        const existing = await shopifyRequest(`collections.json?handle=${subcollectionHandle}`);
        
        if (existing.collections.length === 0) {
          // Créer la sous-collection
          await shopifyRequest('collections.json', 'POST', {
            collection: {
              title: subcollectionTitle,
              handle: subcollectionHandle,
              collection_type: 'smart',
              rules: [
                {
                  column: 'tag',
                  relation: 'equals',
                  condition: `cat:${collection.handle}`
                },
                {
                  column: 'tag', 
                  relation: 'equals',
                  condition: `sub:${subcategory}`
                }
              ]
            }
          });
          console.log(`✅ Sous-collection créée: ${subcollectionTitle}`);
        } else {
          console.log(`⚠️  Sous-collection existe déjà: ${subcollectionTitle}`);
        }
      } catch (error) {
        console.error(`❌ Erreur création sous-collection ${subcollectionTitle}:`, error.message);
      }
    }
  }
}

async function generateDiagnostics(collections) {
  console.log('📊 Génération du rapport de diagnostic...');
  
  const report = {
    categories: {},
    subcategories: {},
    issues: []
  };
  
  for (const [collectionId, collection] of Object.entries(collections)) {
    try {
      const productsData = await shopifyRequest(`collections/${collectionId}/products.json?limit=250`);
      const products = productsData.products || [];
      
      report.categories[collection.title] = {
        id: collectionId,
        handle: collection.handle,
        productCount: products.length,
        published: collection.published
      };
      
      // Vérifier les tags
      for (const product of products) {
        const currentTags = product.tags ? product.tags.split(', ') : [];
        const requiredTag = `cat:${collection.handle}`;
        
        if (!currentTags.includes(requiredTag)) {
          report.issues.push({
            type: 'missing_tag',
            product: product.title,
            collection: collection.title,
            requiredTag
          });
        }
        
        // Compter les sous-catégories
        const subTags = currentTags.filter(tag => tag.startsWith('sub:'));
        for (const subTag of subTags) {
          const subcategory = subTag.replace('sub:', '');
          if (!report.subcategories[subcategory]) {
            report.subcategories[subcategory] = 0;
          }
          report.subcategories[subcategory]++;
        }
      }
    } catch (error) {
      console.error(`❌ Erreur diagnostic ${collection.title}:`, error.message);
    }
  }
  
  console.log('\n📋 RAPPORT DE DIAGNOSTIC');
  console.log('========================');
  
  console.log('\n🏷️  CATÉGORIES:');
  for (const [title, data] of Object.entries(report.categories)) {
    console.log(`  ${title}: ${data.productCount} produits (${data.published ? 'publiée' : 'cachée'})`);
  }
  
  console.log('\n📂 SOUS-CATÉGORIES:');
  for (const [subcategory, count] of Object.entries(report.subcategories)) {
    console.log(`  ${subcategory}: ${count} produits`);
  }
  
  if (report.issues.length > 0) {
    console.log('\n⚠️  PROBLÈMES DÉTECTÉS:');
    for (const issue of report.issues) {
      console.log(`  ${issue.type}: ${issue.product} (${issue.collection}) - Tag manquant: ${issue.requiredTag}`);
    }
  } else {
    console.log('\n✅ Aucun problème détecté');
  }
  
  return report;
}

async function main() {
  try {
    console.log('🚀 Configuration des catégories Shopify...\n');
    
    // A. Résolution des collections
    const collections = await resolveCollections();
    
    // B. Création des métachamps
    await createMetafields();
    
    // C. Synchronisation des tags
    await syncProductTags(collections);
    
    // E. Création des sous-collections
    await createSubcollections(collections);
    
    // I. Génération du diagnostic
    const report = await generateDiagnostics(collections);
    
    console.log('\n✅ Configuration terminée !');
    console.log('\n📝 Prochaines étapes manuelles:');
    console.log('  1. Configurer les filtres Search & Discovery dans l\'admin Shopify');
    console.log('  2. Mettre à jour la navigation avec les nouvelles collections');
    console.log('  3. Intégrer le filtrage dans l\'app RDV');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  resolveCollections,
  createMetafields,
  syncProductTags,
  createSubcollections,
  generateDiagnostics
};

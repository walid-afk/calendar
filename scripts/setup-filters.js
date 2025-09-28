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

async function setupSearchFilters() {
  console.log('🔍 Configuration des filtres Search & Discovery...');
  
  try {
    // Récupérer les collections
    const collections = {};
    for (const id of CATEGORY_IDS) {
      try {
        const data = await shopifyRequest(`collections/${id}.json`);
        const collection = data.collection;
        collections[id] = {
          title: collection.title,
          handle: collection.handle
        };
      } catch (error) {
        console.error(`❌ Erreur collection ${id}:`, error.message);
      }
    }
    
    // Configuration des filtres pour chaque collection
    for (const [collectionId, collection] of Object.entries(collections)) {
      console.log(`\n📋 Configuration des filtres pour: ${collection.title}`);
      
      // 1. Filtre par sous-catégorie (tags)
      try {
        await shopifyRequest('search_filters.json', 'POST', {
          search_filter: {
            name: `Sous-catégorie - ${collection.title}`,
            type: 'tag',
            values: [
              'sub:haute-frequence',
              'sub:ipl', 
              'sub:cire',
              'sub:mains',
              'sub:pieds',
              'sub:maquillage',
              'sub:teinture'
            ],
            collection_id: parseInt(collectionId)
          }
        });
        console.log(`✅ Filtre sous-catégorie créé pour ${collection.title}`);
      } catch (error) {
        console.log(`⚠️  Filtre sous-catégorie existe déjà ou erreur:`, error.message);
      }
      
      // 2. Filtre par zone (tags)
      try {
        await shopifyRequest('search_filters.json', 'POST', {
          search_filter: {
            name: `Zone - ${collection.title}`,
            type: 'tag',
            values: [
              'zone:jambe',
              'zone:bras',
              'zone:aisselles',
              'zone:maillot',
              'zone:visage',
              'zone:dos',
              'zone:ventre',
              'zone:pieds',
              'zone:mains',
              'zone:ongles',
              'zone:sourcils',
              'zone:levres',
              'zone:yeux'
            ],
            collection_id: parseInt(collectionId)
          }
        });
        console.log(`✅ Filtre zone créé pour ${collection.title}`);
      } catch (error) {
        console.log(`⚠️  Filtre zone existe déjà ou erreur:`, error.message);
      }
      
      // 3. Filtre par durée (métachamp)
      try {
        await shopifyRequest('search_filters.json', 'POST', {
          search_filter: {
            name: `Durée - ${collection.title}`,
            type: 'metafield',
            metafield_namespace: 'custom',
            metafield_key: 'duration_minutes',
            collection_id: parseInt(collectionId)
          }
        });
        console.log(`✅ Filtre durée créé pour ${collection.title}`);
      } catch (error) {
        console.log(`⚠️  Filtre durée existe déjà ou erreur:`, error.message);
      }
      
      // 4. Filtre par prix (métachamp)
      try {
        await shopifyRequest('search_filters.json', 'POST', {
          search_filter: {
            name: `Prix - ${collection.title}`,
            type: 'metafield',
            metafield_namespace: 'custom',
            metafield_key: 'price_from',
            collection_id: parseInt(collectionId)
          }
        });
        console.log(`✅ Filtre prix créé pour ${collection.title}`);
      } catch (error) {
        console.log(`⚠️  Filtre prix existe déjà ou erreur:`, error.message);
      }
    }
    
    console.log('\n✅ Filtres Search & Discovery configurés !');
    
  } catch (error) {
    console.error('❌ Erreur configuration filtres:', error);
  }
}

async function verifyFilters() {
  console.log('\n🔍 Vérification des filtres configurés...');
  
  try {
    const response = await shopifyRequest('search_filters.json');
    const filters = response.search_filters || [];
    
    console.log(`📊 ${filters.length} filtres trouvés:`);
    
    const filtersByCollection = {};
    for (const filter of filters) {
      const collectionId = filter.collection_id?.toString();
      if (collectionId && CATEGORY_IDS.includes(collectionId)) {
        if (!filtersByCollection[collectionId]) {
          filtersByCollection[collectionId] = [];
        }
        filtersByCollection[collectionId].push(filter.name);
      }
    }
    
    for (const [collectionId, filterNames] of Object.entries(filtersByCollection)) {
      console.log(`\n📋 Collection ${collectionId}:`);
      filterNames.forEach(name => console.log(`  - ${name}`));
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification filtres:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Configuration des filtres Search & Discovery...\n');
    
    await setupSearchFilters();
    await verifyFilters();
    
    console.log('\n✅ Configuration terminée !');
    console.log('\n📝 Instructions:');
    console.log('  1. Vérifiez dans l\'admin Shopify > Online Store > Search & Discovery');
    console.log('  2. Activez les filtres sur les pages de collection');
    console.log('  3. Testez les filtres sur le front-end');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  setupSearchFilters,
  verifyFilters
};

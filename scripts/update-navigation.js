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

const SUBCATEGORIES = {
  'epilation': ['haute-frequence', 'ipl', 'cire'],
  'mains-pieds': ['mains', 'pieds'],
  'soins-corps': [],
  'soin-visage': [],
  'maquillage-teinture': ['maquillage', 'teinture']
};

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

async function getCollections() {
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
  
  return collections;
}

async function getSubcollections(collections) {
  const subcollections = {};
  
  for (const [collectionId, collection] of Object.entries(collections)) {
    const subcategories = SUBCATEGORIES[collection.handle] || [];
    
    for (const subcategory of subcategories) {
      const subcollectionHandle = `${collection.handle}-${subcategory}`;
      
      try {
        const data = await shopifyRequest(`collections.json?handle=${subcollectionHandle}`);
        if (data.collections.length > 0) {
          const subcollection = data.collections[0];
          if (!subcollections[collectionId]) {
            subcollections[collectionId] = [];
          }
          subcollections[collectionId].push({
            id: subcollection.id,
            title: subcollection.title,
            handle: subcollection.handle
          });
        }
      } catch (error) {
        console.error(`❌ Erreur sous-collection ${subcollectionHandle}:`, error.message);
      }
    }
  }
  
  return subcollections;
}

async function updateMainMenu(collections, subcollections) {
  console.log('📋 Mise à jour du menu principal...');
  
  try {
    // Récupérer le menu principal
    const menusData = await shopifyRequest('menus.json');
    let mainMenu = menusData.menus.find(menu => menu.handle === 'main-menu');
    
    if (!mainMenu) {
      // Créer le menu principal s'il n'existe pas
      const createData = await shopifyRequest('menus.json', 'POST', {
        menu: {
          name: 'Menu principal',
          handle: 'main-menu'
        }
      });
      mainMenu = createData.menu;
    }
    
    // Construire les items du menu
    const menuItems = [];
    
    for (const [collectionId, collection] of Object.entries(collections)) {
      const categoryItem = {
        title: collection.title,
        url: `/collections/${collection.handle}`,
        target: '_self'
      };
      
      // Ajouter les sous-catégories si elles existent
      const subs = subcollections[collectionId] || [];
      if (subs.length > 0) {
        categoryItem.items = subs.map(sub => ({
          title: sub.title,
          url: `/collections/${sub.handle}`,
          target: '_self'
        }));
      }
      
      menuItems.push(categoryItem);
    }
    
    // Mettre à jour le menu
    await shopifyRequest(`menus/${mainMenu.id}.json`, 'PUT', {
      menu: {
        id: mainMenu.id,
        items: menuItems
      }
    });
    
    console.log('✅ Menu principal mis à jour');
    
  } catch (error) {
    console.error('❌ Erreur mise à jour menu:', error.message);
  }
}

async function createNavigationTemplate(collections, subcollections) {
  console.log('📄 Création du template de navigation...');
  
  const template = `
<!-- Navigation des catégories -->
<nav class="categories-nav">
  <ul class="categories-list">
    ${Object.entries(collections).map(([collectionId, collection]) => {
      const subs = subcollections[collectionId] || [];
      return `
        <li class="category-item">
          <a href="/collections/${collection.handle}" class="category-link">
            ${collection.title}
          </a>
          ${subs.length > 0 ? `
            <ul class="subcategories-list">
              ${subs.map(sub => `
                <li class="subcategory-item">
                  <a href="/collections/${sub.handle}" class="subcategory-link">
                    ${sub.title}
                  </a>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </li>
      `;
    }).join('')}
  </ul>
</nav>

<style>
.categories-nav {
  margin: 20px 0;
}

.categories-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-item {
  position: relative;
}

.category-link {
  display: block;
  padding: 10px 15px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: all 0.2s ease;
}

.category-link:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.subcategories-list {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 8px 0;
  margin: 0;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 1000;
}

.category-item:hover .subcategories-list {
  opacity: 1;
  visibility: visible;
}

.subcategory-item {
  margin: 0;
}

.subcategory-link {
  display: block;
  padding: 8px 16px;
  text-decoration: none;
  color: #666;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.subcategory-link:hover {
  background: #f8f9fa;
  color: #333;
}

@media (max-width: 768px) {
  .categories-list {
    flex-direction: column;
  }
  
  .subcategories-list {
    position: static;
    opacity: 1;
    visibility: visible;
    box-shadow: none;
    border: none;
    background: #f8f9fa;
    margin-top: 8px;
  }
}
</style>
  `;
  
  // Sauvegarder le template
  const fs = require('fs');
  fs.writeFileSync('templates/categories-navigation.liquid', template);
  
  console.log('✅ Template de navigation créé: templates/categories-navigation.liquid');
}

async function main() {
  try {
    console.log('🚀 Mise à jour de la navigation...\n');
    
    // Récupérer les collections
    const collections = await getCollections();
    console.log(`📦 ${Object.keys(collections).length} collections trouvées`);
    
    // Récupérer les sous-collections
    const subcollections = await getSubcollections(collections);
    console.log(`📁 ${Object.values(subcollections).flat().length} sous-collections trouvées`);
    
    // Mettre à jour le menu principal
    await updateMainMenu(collections, subcollections);
    
    // Créer le template de navigation
    await createNavigationTemplate(collections, subcollections);
    
    console.log('\n✅ Navigation mise à jour !');
    console.log('\n📝 Instructions:');
    console.log('  1. Le menu principal a été mis à jour dans l\'admin Shopify');
    console.log('  2. Le template categories-navigation.liquid est prêt à être intégré');
    console.log('  3. Vérifiez que les collections sont bien publiées');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getCollections,
  getSubcollections,
  updateMainMenu,
  createNavigationTemplate
};

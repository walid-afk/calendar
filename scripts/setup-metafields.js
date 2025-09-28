const fetch = require('node-fetch');

// Configuration
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2023-10';

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

async function createMetafields() {
  console.log('📝 Création des métachamps...');
  
  // Métachamps produits
  const productMetafields = [
    {
      namespace: 'global',
      key: 'soin_category',
      type: 'single_line_text_field',
      description: 'Catégorie de soin (obligatoire)'
    },
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

async function main() {
  try {
    console.log('🚀 Configuration des métachamps Shopify...');
    
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_TOKEN) {
      throw new Error('Variables d\'environnement SHOPIFY_STORE_DOMAIN et SHOPIFY_ADMIN_TOKEN requises');
    }
    
    await createMetafields();
    
    console.log('✅ Configuration terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();

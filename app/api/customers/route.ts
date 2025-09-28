import { NextRequest, NextResponse } from 'next/server';
import { shopifyFetchWithThrottle } from '@/lib/shopify-throttle';

export const dynamic = 'force-dynamic';

// Normaliser le numéro de téléphone
function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Supprimer tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Si commence par 33, remplacer par +33
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    return '+' + cleaned;
  }
  
  // Si commence par 0, remplacer par +33
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+33' + cleaned.substring(1);
  }
  
  // Si déjà au format international, garder tel quel
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    return '+' + cleaned;
  }
  
  return phone; // Retourner tel quel si format non reconnu
}

// Rechercher un client existant par email ou téléphone
async function findExistingCustomer(email?: string, phone?: string) {
  if (!email && !phone) return null;
  
  try {
    let query = '';
    if (email) {
      query = `email:${email}`;
    } else if (phone) {
      query = `phone:${phone}`;
    }
    
    const response = await shopifyFetchWithThrottle(`/customers/search.json?query=${encodeURIComponent(query)}`);
    
    if (response.data.customers && response.data.customers.length > 0) {
      return response.data.customers[0];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur recherche client:', error);
    return null;
  }
}

// Créer un nouveau client
async function createCustomer(customerData: any) {
  try {
    const response = await shopifyFetchWithThrottle('/customers.json', 'POST', { customer: customerData });
    
    console.log('customer.create.ok', response.data.customer?.id);
    return response.data.customer;
  } catch (error) {
    console.error('Erreur création client:', error);
    throw error;
  }
}

// Mettre à jour un client existant
async function updateCustomer(customerId: string, customerData: any) {
  try {
    const response = await shopifyFetchWithThrottle(`/customers/${customerId}.json`, 'PUT', { customer: customerData });
    
    console.log('customer.update.ok', customerId);
    return response.data.customer;
  } catch (error) {
    console.error('Erreur mise à jour client:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, phone, notes } = body;
    
    // Validation des champs requis
    if (!firstName || !lastName) {
      return NextResponse.json({
        ok: false,
        error: 'Prénom et nom requis'
      }, { status: 400 });
    }
    
    // Normaliser les données
    const normalizedData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email?.trim() || null,
      phone: phone ? normalizePhone(phone) : null,
      notes: notes?.trim() || null,
      marketing_opt_in_level: 'single_opt_in'
    };
    
    // Rechercher un client existant
    const existingCustomer = await findExistingCustomer(normalizedData.email, normalizedData.phone);
    
    let customer;
    
    if (existingCustomer) {
      // Mettre à jour le client existant
      console.log('customer.dedupe.hit', existingCustomer.id);
      customer = await updateCustomer(existingCustomer.id.toString(), normalizedData);
    } else {
      // Créer un nouveau client
      customer = await createCustomer(normalizedData);
    }
    
    // Retourner le client normalisé
    return NextResponse.json({
      ok: true,
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone
      }
    });
    
  } catch (error: any) {
    console.error('Erreur /api/customers:', error);
    
    // Gérer les erreurs spécifiques
    if (error.message?.includes('Email has already been taken')) {
      return NextResponse.json({
        ok: false,
        error: 'Cette adresse email est déjà utilisée'
      }, { status: 409 });
    }
    
    if (error.message?.includes('Phone is invalid')) {
      return NextResponse.json({
        ok: false,
        error: 'Numéro de téléphone invalide'
      }, { status: 400 });
    }
    
    if (error.message?.includes('429')) {
      return NextResponse.json({
        ok: false,
        error: 'Trop de requêtes, veuillez réessayer dans quelques instants'
      }, { status: 429 });
    }
    
    return NextResponse.json({
      ok: false,
      error: 'Erreur lors de la création du client'
    }, { status: 500 });
  }
}

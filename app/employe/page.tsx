'use client'

import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
dayjs.locale('fr')
import { 
  Page, 
  Card, 
  TextField, 
  Button, 
  Banner, 
  Toast, 
  Frame,
  Layout,
} from '@shopify/polaris'
import { TopBar } from '@/app/components/TopBar'
import { ServicesList } from '@/app/components/ServicesList'
import { CartPanel } from '@/app/components/CartPanel'
import { CustomerPicker } from '@/app/components/CustomerPicker'
import { SlotsGrid } from '@/app/components/SlotsGrid'
import StaffPicker from '@/app/components/StaffPicker'
import WeekSlots from '@/app/components/WeekSlots'
import { CategoryFilter } from '@/app/components/CategoryFilter'
import ServiceSelector from '@/app/components/ServiceSelector'
import { openCenteredPopup } from '@/app/lib/openOAuthPopup'
import { getDaySlots } from '@/app/lib/availability'
import type { Employee, SlotOption } from '@/types'
// Fonction locale pour obtenir la date d'aujourd'hui
function today(): string {
  return new Date().toISOString().split('T')[0]
}

// Employee interface now imported from types.ts

interface Service {
  id: number
  title: string
  handle: string
  images: string[]
  soin_category: string | null
  subcategory: string | null
  areas: string[]
  durationMinutes: number
  priceFrom: number
  variants: Array<{
    id: number
    title: string
    durationMinutes: number | null
    price: number | null
    area: string | null
  }>
}

interface Customer {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
}

interface CartItem {
  id: number
  title: string
  price: string
  durationMinutes: number
}

interface SlotData {
  cells: Array<{
    start: string
    end: string
    idx: number
    busy: boolean
  }>
  validStarts: number[]
  need: number
  needWithBuffer: number
  step: number
}

export default function EmployeePage() {
  // État d'authentification
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  // État de l'interface
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedDate, setSelectedDate] = useState(today())
  const [services, setServices] = useState<Service[]>([])
  const [servicesError, setServicesError] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [slotData, setSlotData] = useState<SlotData | null>(null)
  const [selectedStart, setSelectedStart] = useState<string | undefined>()
  const [selectedEnd, setSelectedEnd] = useState<string | undefined>()
  const [categoryFilters, setCategoryFilters] = useState<{
    collectionId?: string
    subcategory?: string
    area?: string
  }>({})
  const [showCategoryFilters, setShowCategoryFilters] = useState(false)
  
  // État pour la sélection de service
  const [selectedVariant, setSelectedVariant] = useState<{
    id: number
    title: string
    price: number
    duration: number
    area?: string
    productId: number
    productTitle: string
  } | null>(null)

  // États pour la gestion des créneaux
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [cells, setCells] = useState<any[]>([])
  const [validStarts, setValidStarts] = useState<number[]>([])
  const [need, setNeed] = useState(0)
  const [step, setStep] = useState(15)

  // États pour la nouvelle interface
  const [staff, setStaff] = useState<string>('any')
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = dayjs(); 
    const wd = d.day(); // 0 = dimanche
    const monday = d.subtract((wd + 6) % 7, 'day'); // ramener à lundi
    return monday.toDate();
  })

  // État des toasts
  const [toast, setToast] = useState<{
    content: string
    isError?: boolean
  } | null>(null)

  // État de la connexion Google
  const [gStatus, setGStatus] = useState<'unknown'|'connected'|'disconnected'|'connecting'>('unknown')
  const [showGoogleConnectionPrompt, setShowGoogleConnectionPrompt] = useState(false)

  // Chargement initial
  useEffect(() => {
    // Ne pas charger automatiquement le passcode pour forcer la saisie manuelle
    // const savedPasscode = localStorage.getItem('passcode')
    // if (savedPasscode) {
    //   setPasscode(savedPasscode)
    //   handleAuth(savedPasscode)
    // }
    
    // Vérifier le statut Google au chargement
    checkGoogleStatus()
    
    // Écouter les messages de la popup OAuth
    const handler = (ev: MessageEvent) => {
      if (typeof ev.data === 'object' && ev.data?.type === 'google-oauth-complete') {
        setTimeout(checkGoogleStatus, 500) // le temps que le token soit stocké
      }
    }
    window.addEventListener('message', handler)

    // Écouter l'événement de connexion Google requise
    const handleGoogleConnectionRequired = () => {
      setShowGoogleConnectionPrompt(true);
      setGStatus('disconnected');
      setIsGoogleConnected(false);
    };
    window.addEventListener('google-connection-required', handleGoogleConnectionRequired);
    
    // Vérifier si on revient d'une connexion Google
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('google_connected') === 'true') {
      setToast({ 
        content: '✅ Connexion Google réussie ! Les données sont maintenant synchronisées.',
        isError: false 
      })
      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname)
      checkGoogleStatus()
    }
    
    return () => {
      window.removeEventListener('message', handler)
      window.removeEventListener('google-connection-required', handleGoogleConnectionRequired)
    }
  }, [])


  // Vérification de la connexion Google
  useEffect(() => {
    if (isAuthenticated) {
      checkGoogleConnection()
    }
  }, [isAuthenticated])

  // Chargement des employés
  useEffect(() => {
    if (isGoogleConnected) {
      loadEmployees()
    }
  }, [isGoogleConnected])

  // Chargement des services
  useEffect(() => {
    if (isAuthenticated) {
      loadServices()
    }
  }, [isAuthenticated])

  // Rechargement des services quand les filtres changent
  useEffect(() => {
    if (isAuthenticated) {
      loadServices(categoryFilters.collectionId, categoryFilters.subcategory, categoryFilters.area)
    }
  }, [categoryFilters, isAuthenticated])
  
  // Gérer la sélection d'une variante
  const handleVariantSelect = (variant: any) => {
    setSelectedVariant(variant)
    
    // Mettre à jour la durée pour les créneaux
    if (variant && variant.duration) {
      setNeed(variant.duration)
      // Recharger les créneaux avec la nouvelle durée
      if (isGoogleConnected) {
        loadSlots()
      }
    }
  }

  // Rechargement des créneaux quand les paramètres changent
  useEffect(() => {
    if (selectedEmployee && selectedDate && selectedVariant) {
      loadSlots()
    } else {
      setSlotData(null)
    }
  }, [selectedEmployee, selectedDate, selectedVariant])

  const handleAuth = async (code: string) => {
    // Code d'accès : 0000 = test, 1234 = production
    if (code === '0000') {
      // Mode test : accepté directement
      setIsAuthenticated(true)
      localStorage.setItem('passcode', code)
      setAuthError(null)
    } else if (code === '1234') {
      // Mode production : vérifier avec l'API
      try {
        const response = await fetch('/api/auth/check', {
          headers: { 'x-passcode': code }
        })
        
        if (response.ok) {
          setIsAuthenticated(true)
          localStorage.setItem('passcode', code)
          setAuthError(null)
        } else {
          setAuthError('Code d\'accès invalide')
        }
      } catch (error) {
        setAuthError('Erreur de connexion')
      }
    } else {
      setAuthError('Code d\'accès invalide')
    }
  }

  const checkGoogleConnection = async () => {
    if (passcode === '0000') {
      // Mode test : simulation
      setIsGoogleConnected(true)
      setGStatus('connected')
      setShowGoogleConnectionPrompt(false)
    } else {
      // Mode production : vérifier la vraie connexion Google (sans passcode)
      try {
        const response = await fetch('/api/google/status')
        const data = await response.json()
        
        if (data.connected) {
          setIsGoogleConnected(true)
          setGStatus('connected')
          setShowGoogleConnectionPrompt(false)
        } else {
          setIsGoogleConnected(false)
          setGStatus('disconnected')
          setShowGoogleConnectionPrompt(true)
        }
      } catch (error) {
        console.error('Erreur vérification Google:', error);
        setIsGoogleConnected(false)
        setGStatus('disconnected')
        setShowGoogleConnectionPrompt(true)
      }
    }
  }

  const loadEmployees = async () => {
    try {
      console.log('🔄 Chargement des employés...');
      const response = await fetch('/api/employees', {
        headers: { 'x-passcode': passcode }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Employés chargés:', data.items?.length || 0);
        setEmployees(data.items || [])
      } else {
        const errorData = await response.json()
        console.error('❌ Erreur API employés:', errorData);
        
        // Si erreur de connexion Google, déclencher l'UI de connexion
        if (response.status === 401 && errorData.error === 'google_not_connected') {
          setShowGoogleConnectionPrompt(true)
          setGStatus('disconnected')
          setIsGoogleConnected(false)
        } else {
          setToast({ content: errorData.error || 'Erreur lors du chargement des employés', isError: true })
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des employés:', error)
      setToast({ content: 'Erreur de connexion lors du chargement des employés', isError: true })
    }
  }

  const loadServices = async (collectionId?: string, subcategory?: string, area?: string) => {
    try {
      setServicesError(null)
      const params = new URLSearchParams()
      if (collectionId) params.append('collectionId', collectionId)
      if (subcategory) params.append('subcategory', subcategory)
      if (area) params.append('area', area)
      
      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: { 'x-passcode': passcode }
      })
      
      if (response.ok) {
        const data = await response.json()
        setServices(data.items || [])
        setServicesError(null)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Erreur lors du chargement des services'
        setServicesError(errorMessage)
        setServices([])
        setToast({ content: errorMessage, isError: true })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error)
      const errorMessage = 'Erreur de connexion lors du chargement des services'
      setServicesError(errorMessage)
      setServices([])
      setToast({ content: errorMessage, isError: true })
    }
  }
  
  const loadServicesWithTaxonomy = async (filters: { category?: string, subcategory?: string, area?: string }) => {
    try {
      setServicesError(null)
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.subcategory) params.append('subcategory', filters.subcategory)
      if (filters.area) params.append('area', filters.area)
      
      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: { 'x-passcode': passcode }
      })
      
      if (response.ok) {
        const data = await response.json()
        setServices(data.items || [])
        setServicesError(null)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Erreur lors du chargement des services'
        setServicesError(errorMessage)
        setServices([])
        setToast({ content: errorMessage, isError: true })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error)
      const errorMessage = 'Erreur de connexion lors du chargement des services'
      setServicesError(errorMessage)
      setServices([])
      setToast({ content: errorMessage, isError: true })
    }
  }

  const loadSlots = async (opts?: { leadOverride?: number; bufferOverride?: number }) => {
    setLoadingSlots(true);
    setBanner('');

    if (!selectedEmployee || !selectedVariant) {
      setCells([]); setValidStarts([]); setSelectedStart(undefined); setLoadingSlots(false);
      return;
    }

    const totalMinutes = selectedVariant.duration;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const r = await fetch('/api/freebusy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-passcode': passcode
        },
        body: JSON.stringify({ 
          calendarId: selectedEmployee, 
          date: selectedDate, 
          durationMinutes: totalMinutes,
          leadMinutes: opts?.leadOverride,
          postBufferMinutes: opts?.bufferOverride
        }),
        signal: controller.signal,
        cache: 'no-store',
      });
      const data = await r.json();

      if (!r.ok) {
        if (r.status === 401 && data?.error === 'google_not_connected') {
          setShowGoogleConnectionPrompt(true)
          setGStatus('disconnected')
          setIsGoogleConnected(false)
          setBanner('Google non connecté — connecte-toi pour afficher les créneaux.');
        } else if (r.status === 504 || data?.error === 'google_timeout') {
          setBanner('Google a mis trop de temps à répondre. Réessaie.');
        } else {
          setBanner('Erreur de chargement des créneaux. Réessaie.');
        }
        setCells([]); setValidStarts([]); setSelectedStart(undefined);
        return;
      }

      setCells(data.cells || []);
      setValidStarts(data.validStarts || []);
      setNeed(data.need || 0);
      setStep(data.step || 15);
      setSelectedStart(undefined);

      // Gestion des raisons si aucun créneau
      if (data?.meta?.reasons?.length && (data.validStarts||[]).length === 0) {
        const reasonMessages = {
          duration_exceeds_open_hours: "la durée dépasse les heures d'ouverture",
          all_day_event: "journée bloquée par un événement sur l'agenda",
          lead_filters_all: "le délai minimum avant RDV filtre tout",
          buffer_filters_all: "le buffer après RDV filtre tout",
          all_cells_conflict: "toute la journée est occupée",
          no_cells_generated: "aucune cellule générée (vérifie l'ouverture)"
        };
        
        const messages = data.meta.reasons.map((r: string) => reasonMessages[r as keyof typeof reasonMessages] || r);
        setBanner("Aucun créneau — " + messages.join(' • '));
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setBanner('Timeout côté client. Réessaie.');
      } else {
        setBanner('Erreur réseau. Vérifie ta connexion puis réessaie.');
      }
      setCells([]); setValidStarts([]); setSelectedStart(undefined);
    } finally {
      clearTimeout(timer);
      setLoadingSlots(false);
    }
  }

  const checkGoogleStatus = async () => {
    try {
      const response = await fetch('/api/google/status', { cache: 'no-store' })
      const data = await response.json()
      setGStatus(data.connected ? 'connected' : 'disconnected')
      setIsGoogleConnected(data.connected)
      setShowGoogleConnectionPrompt(!data.connected)
    } catch (error) {
      console.error('Erreur lors de la vérification du statut Google:', error)
      setGStatus('disconnected')
      setIsGoogleConnected(false)
      setShowGoogleConnectionPrompt(true)
    }
  }

  const startGoogleLogin = () => {
    setGStatus('connecting')
    const win = openCenteredPopup('/api/google/auth')
    
    if (!win) {
      // Popup bloquée → fallback en redirection plein écran
      setToast({ 
        content: 'Popup bloquée par le navigateur. Redirection vers la page de connexion...', 
        isError: false 
      })
      setTimeout(() => {
        // Redirection vers OAuth Google (seulement pour la connexion initiale)
        window.location.href = '/api/google/auth'
      }, 1000)
    } else {
      // Optionnel: polling sécurité si le postMessage est filtré
      const timer = setInterval(async () => {
        try {
          const response = await fetch('/api/google/status', { cache: 'no-store' })
          const data = await response.json()
          if (data.connected) {
            clearInterval(timer)
            setGStatus('connected')
            setIsGoogleConnected(true)
            setShowGoogleConnectionPrompt(false)
            setToast({ content: 'Connexion Google réussie !', isError: false })
            
            // Recharger automatiquement les données après connexion
            await loadEmployees()
            await loadServices()
            
            // Déclencher le rafraîchissement des créneaux
            const event = new CustomEvent('refresh-slots');
            window.dispatchEvent(event);
            try { 
              win.close() 
            } catch {}
          }
        } catch (error) {
          console.error('Erreur polling:', error)
        }
      }, 1000)
      
      // Sécurité: arrêter après 2 min
      setTimeout(() => {
        clearInterval(timer)
        if (gStatus === 'connecting') {
          setGStatus('disconnected')
          setToast({ 
            content: 'Timeout de connexion. Veuillez réessayer.', 
            isError: true 
          })
        }
      }, 120000)
    }
  }

  const handleAddService = (service: Service) => {
    const cartItem: CartItem = {
      id: service.id,
      title: service.title,
      price: service.priceFrom.toString(),
      durationMinutes: service.durationMinutes
    }
    setCartItems(prev => [...prev, cartItem])
  }

  // Fonction pour ajouter la variante sélectionnée au panier
  const handleAddSelectedVariant = () => {
    if (selectedVariant) {
      const cartItem: CartItem = {
        id: selectedVariant.id,
        title: `${selectedVariant.productTitle} - ${selectedVariant.title}`,
        price: selectedVariant.price.toString(),
        durationMinutes: selectedVariant.duration
      }
      setCartItems(prev => [...prev, cartItem])
    }
  }

  const handleRemoveService = (serviceId: number) => {
    setCartItems(prev => prev.filter(item => item.id !== serviceId))
  }

  const handleClearCart = () => {
    setCartItems([])
    setSelectedStart(undefined)
    setSelectedEnd(undefined)
  }

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer)
  }

  const handleCustomerCreate = (customer: Customer) => {
    setSelectedCustomer(customer)
  }

  const handleSlotSelect = (start: string, end: string) => {
    setSelectedStart(start)
    setSelectedEnd(end)
  }

  // Fonctions pour la nouvelle interface
  const headers = useCallback(() => {
    return passcode ? { 'x-passcode': passcode } : {}
  }, [passcode])

  const getSlotsForDay = useCallback(async (ymd: string) => {
    const totalMinutes = cartItems.reduce((sum, item) => sum + item.durationMinutes, 0);
    console.log('🔍 getSlotsForDay debug:', {
      ymd,
      employeesCount: employees.length,
      totalMinutes,
      staff,
      cartItemsCount: cartItems.length
    });
    
    if (employees.length === 0) {
      console.log('❌ Aucun employé chargé');
      return [];
    }
    
    if (totalMinutes <= 0) {
      console.log('❌ Aucun service dans le panier (totalMinutes = 0)');
      return [];
    }
    
    try {
      const slots = await getDaySlots(ymd, employees, totalMinutes, staff, headers() as Record<string, string>);
      console.log('✅ Créneaux récupérés:', slots.length, 'pour', ymd);
      return slots;
    } catch (error) {
      console.error('❌ Erreur lors du chargement des créneaux:', error);
      return [];
    }
  }, [employees, cartItems, staff, headers]);

  function onPrevWeek() { 
    setWeekStart((d) => dayjs(d).subtract(7,'day').toDate()); 
  }
  
  function onNextWeek() { 
    setWeekStart((d) => dayjs(d).add(7,'day').toDate()); 
  }

  function onPick(slot: SlotOption) {
    // si staff === 'any', on a slot.employeeId => l'utiliser pour book
    const chosenEmployee = staff === 'any' ? slot.employeeId! : staff;
    console.log('Choisi:', { start: slot.start, end: slot.end, calendarId: chosenEmployee });
    
    // Mettre à jour les sélections pour la réservation
    setSelectedEmployee(chosenEmployee);
    setSelectedDate(slot.start.split('T')[0]);
    setSelectedStart(slot.start);
    setSelectedEnd(slot.end);
    
    setToast({
      content: `Créneau sélectionné: ${slot.display} avec ${chosenEmployee}`,
      isError: false
    });
  }

  const handleBooking = async () => {
    if (!selectedEmployee || !selectedDate || !selectedStart || !selectedEnd || 
        cartItems.length === 0 || !selectedCustomer) {
      setToast({ content: 'Veuillez remplir tous les champs', isError: true })
      return
    }

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-passcode': passcode
        },
        body: JSON.stringify({
          calendarId: selectedEmployee,
          start: selectedStart,
          end: selectedEnd,
          customer: {
            id: selectedCustomer.id,
            email: selectedCustomer.email,
            name: `${selectedCustomer.first_name} ${selectedCustomer.last_name}`,
            phone: selectedCustomer.phone
          },
          items: cartItems.map(item => ({
            productId: item.id,
            title: item.title,
            durationMinutes: item.durationMinutes,
            price: item.price
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        setToast({ 
          content: `✅ Réservation confirmée !`,
          isError: false 
        })
        
        // Réinitialiser le formulaire
        setCartItems([])
        setSelectedCustomer(null)
        setSelectedStart(undefined)
        setSelectedEnd(undefined)
        setSlotData(null)
        
        // Rafraîchir automatiquement la grille après réservation
        // (pas d'ouverture automatique de Google Calendar)
        setTimeout(() => {
          // Déclencher un rechargement des créneaux
          const event = new CustomEvent('refresh-slots');
          window.dispatchEvent(event);
        }, 1000);
      } else {
        const errorData = await response.json()
        let errorMessage = 'Erreur lors de la réservation'
        if (response.status === 409) {
          errorMessage = 'Créneau indisponible, veuillez choisir un autre horaire.'
        } else if (response.status === 504 || response.status === 502) {
          errorMessage = 'Impossible de contacter le calendrier. Réessayez.'
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
        setToast({ content: errorMessage, isError: true })
      }
    } catch (error) {
      setToast({ content: 'Impossible de contacter le calendrier. Réessayez.', isError: true })
    }
  }

  const totalMinutes = cartItems.reduce((sum, item) => sum + item.durationMinutes, 0)
  const canBook = selectedEmployee && selectedDate && selectedStart && selectedEnd && 
                  cartItems.length > 0 && selectedCustomer

  // Interface de connexion
  if (!isAuthenticated) {
    return (
      <div className="passcode-gate">
        <Card>
          <div className="passcode-form">
            <TextField
              label="Code d'accès"
              value={passcode}
              onChange={setPasscode}
              type="password"
              placeholder="Entrez votre code d'accès"
            />
            {authError && (
              <div style={{ marginTop: '8px' }}>
                <Banner status="critical">{authError}</Banner>
              </div>
            )}
            <div style={{ marginTop: '16px' }}>
              <Button 
                primary 
                onClick={() => handleAuth(passcode)}
                disabled={!passcode.trim()}
              >
                Se connecter
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <Frame>
      <Page title="Interface Employés RDV">
        <TopBar
          isGoogleConnected={isGoogleConnected}
          employees={employees}
          selectedEmployee={selectedEmployee}
          onEmployeeChange={setSelectedEmployee}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onGoogleAuth={startGoogleLogin}
        />

        <div className="booking-container">
          {showGoogleConnectionPrompt && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '300px',
              marginBottom: '20px'
            }}>
              <Card>
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  maxWidth: '400px'
                }}>
                  <div style={{ 
                    fontSize: '48px', 
                    marginBottom: '20px',
                    color: '#6b7280'
                  }}>
                    📅
                  </div>
                  <h2 style={{ 
                    marginBottom: '16px',
                    color: '#111827',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>
                    Connecte-toi à Google
                  </h2>
                  <p style={{ 
                    marginBottom: '24px',
                    color: '#6b7280',
                    lineHeight: '1.5'
                  }}>
                    Connecte-toi à Google pour afficher et réserver des créneaux.
                  </p>
                  <Button 
                    onClick={startGoogleLogin} 
                    primary
                    size="large"
                    disabled={gStatus === 'connecting'}
                  >
                    {gStatus === 'connecting' ? 'Connexion en cours...' : 'Se connecter à Google'}
                  </Button>
                  {gStatus === 'connecting' && (
                    <div style={{ 
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      color: '#6b7280'
                    }}>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid #e5e7eb', 
                        borderTop: '2px solid #008060', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }}></div>
                      <span>Authentification en cours...</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {!showGoogleConnectionPrompt && (
            <div className="booking-grid">
              <div>
                <ServiceSelector
                  onVariantSelect={handleVariantSelect}
                  selectedVariant={selectedVariant}
                />
              </div>

              <div>
                <CartPanel
                  items={cartItems}
                  onRemoveItem={handleRemoveService}
                  onClearCart={handleClearCart}
                />
                {selectedVariant && (
                  <div style={{ marginTop: '16px' }}>
                    <Button
                      onClick={handleAddSelectedVariant}
                      variant="primary"
                      size="large"
                      fullWidth
                    >
                      Ajouter au panier
                    </Button>
                  </div>
                )}
              </div>

              <div className="booking-full-width">
                <CustomerPicker
                  selectedCustomer={selectedCustomer}
                  onCustomerSelect={handleCustomerSelect}
                  onCustomerCreate={handleCustomerCreate}
                />
              </div>

              {/* Nouvelle interface moderne */}
              <div className="booking-full-width">
                <StaffPicker employees={employees} value={staff} onChange={setStaff} />
              </div>

              <div className="booking-full-width">
                <WeekSlots
                  weekStart={weekStart}
                  onPrevWeek={onPrevWeek}
                  onNextWeek={onNextWeek}
                  getSlotsForDay={getSlotsForDay}
                  onPick={onPick}
                />
              </div>


              {!selectedVariant && (
                <div className="booking-full-width">
                  <Card>
                    <div style={{ padding: '16px', textAlign: 'center' }}>
                      <div>Sélectionnez une prestation pour voir les créneaux disponibles</div>
                    </div>
                  </Card>
                </div>
              )}

              <div className="booking-full-width">
                <Card>
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <Button
                      primary
                      size="large"
                      onClick={handleBooking}
                      disabled={!canBook}
                    >
                      Réserver le créneau
                    </Button>
                    {!canBook && (
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#6d7175' }}>
                        {!selectedEmployee && 'Sélectionnez un employé • '}
                        {!selectedDate && 'Sélectionnez une date • '}
                        {cartItems.length === 0 && 'Ajoutez des prestations • '}
                        {!selectedCustomer && 'Sélectionnez une cliente • '}
                        {!selectedStart && 'Sélectionnez un créneau'}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        {toast && (
          <Toast
            content={toast.content}
            error={toast.isError}
            onDismiss={() => setToast(null)}
          />
        )}

      </Page>
    </Frame>
  )
}

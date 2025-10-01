import { google } from 'googleapis'
import { getTokens, saveTokens, hasTokens, GoogleTokens, handleTokenRefresh } from './redis'

export interface CalendarItem {
  id: string
  label: string
}

export async function getOAuth2() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  // Si on a des tokens, les utiliser
  const tokens = await getTokens()
  if (tokens) {
    oauth2.setCredentials(tokens)
    
    // Écouter les refresh de tokens
    oauth2.on('tokens', async (newTokens) => {
      const updatedTokens = {
        access_token: newTokens.access_token || tokens.access_token || '',
        refresh_token: newTokens.refresh_token || tokens.refresh_token,
        expiry_date: newTokens.expiry_date || tokens.expiry_date,
        token_type: newTokens.token_type || tokens.token_type || 'Bearer',
        scope: newTokens.scope || tokens.scope
      }
      await saveTokens(updatedTokens)
    })
  }

  return oauth2
}

export async function getCalendarClient() {
  const auth = await getOAuth2()
  const tokens = await getTokens()

  if (!tokens) {
    const error = new Error('Tokens Google non trouvés. Veuillez vous authentifier.')
    ;(error as any).code = 'NO_GOOGLE_TOKENS'
    throw error
  }

  return google.calendar({ version: 'v3', auth })
}

export async function saveTokensToStore(tokens: GoogleTokens): Promise<boolean> {
  return await saveTokens(tokens)
}

export async function isGoogleConnected(): Promise<boolean> {
  return await hasTokens()
}

export async function pingGoogle(): Promise<boolean> {
  try {
    const cal = await getCalendarClient()
    // Ping avec un timeout court
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    await cal.calendarList.list({ maxResults: 1 }, { signal: controller.signal } as any)
    clearTimeout(timeout)
    return true
  } catch (error) {
    console.error('Erreur ping Google:', error);
    // Si erreur d'authentification, nettoyer les tokens
    if (error && typeof error === 'object' && 'code' in error && 
        (error.code === 401 || error.code === 'NO_GOOGLE_TOKENS')) {
      console.log('Tokens invalides, nettoyage...');
      const { deleteTokens } = await import('./redis');
      await deleteTokens();
    }
    return false
  }
}

/**
 * Liste les calendriers filtrés selon les critères de configuration
 */
export async function listCalendarsFiltered(): Promise<CalendarItem[]> {
  try {
    const calendar = await getCalendarClient()
    const response = await calendar.calendarList.list()
    
    console.log('📅 Calendriers Google récupérés:', response.data.items?.length || 0)
    
    if (!response.data.items) {
      console.log('📅 Aucun calendrier trouvé')
      return []
    }

    const accessRoles = (process.env.CALENDAR_ACCESS_ROLES || 'owner,writer').split(',')
    const includeDomain = process.env.CALENDAR_INCLUDE_DOMAIN
    const excludeRegex = process.env.CALENDAR_EXCLUDE_SUMMARY_REGEX

    console.log('📅 Filtres appliqués:', { accessRoles, includeDomain, excludeRegex })

    let filteredCalendars = response.data.items.filter(item => {
      console.log('📅 Calendrier:', { id: item.id, summary: item.summary, accessRole: item.accessRole })
      
      // Filtre par rôle d'accès
      if (item.accessRole && !accessRoles.includes(item.accessRole)) {
        console.log('📅 Exclu par rôle:', item.accessRole)
        return false
      }

      // Filtre par domaine (si spécifié)
      if (includeDomain && item.id && !item.id.includes(includeDomain)) {
        console.log('📅 Exclu par domaine:', item.id)
        return false
      }

      // Exclusion par regex sur le summary (si spécifié)
      if (excludeRegex && item.summary) {
        const regex = new RegExp(excludeRegex)
        if (regex.test(item.summary)) {
          console.log('📅 Exclu par regex:', item.summary)
          return false
        }
      }

      return true
    })

    console.log('📅 Calendriers filtrés:', filteredCalendars.length)

    return filteredCalendars.map(item => ({
      id: item.id || '',
      label: item.summary || item.id || 'Calendrier sans nom'
    }))
  } catch (error) {
    console.error('Erreur lors de la récupération des calendriers:', error)
    throw error
  }
}

/**
 * Effectue une requête FreeBusy
 */
export async function queryFreeBusy(
  calendarId: string,
  timeMin: string,
  timeMax: string
) {
  try {
    const calendar = await getCalendarClient()
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: calendarId }]
      }
    })

    return response.data
  } catch (error) {
    console.error('Erreur lors de la requête FreeBusy:', error)
    throw new Error('Impossible de vérifier la disponibilité')
  }
}

/**
 * Crée un événement dans le calendrier
 */
export async function createEvent(
  calendarId: string,
  eventData: {
    summary: string
    description: string
    start: { dateTime: string; timeZone: string }
    end: { dateTime: string; timeZone: string }
    attendees?: Array<{ email: string }>
  }
) {
  try {
    const calendar = await getCalendarClient()
    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventData
    })

    return response.data
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error)
    throw new Error('Impossible de créer l\'événement')
  }
}

/**
 * Vérifie si un créneau est disponible (dernière vérification avant réservation)
 */
export async function isSlotAvailable(
  calendarId: string,
  start: string,
  end: string
): Promise<boolean> {
  try {
    const freebusy = await queryFreeBusy(calendarId, start, end)
    
    if (!freebusy.calendars || !freebusy.calendars[calendarId]) {
      return true
    }

    const calendar = freebusy.calendars[calendarId]
    return !calendar.busy || calendar.busy.length === 0
  } catch (error) {
    console.error('Erreur lors de la vérification de disponibilité:', error)
    return false
  }
}
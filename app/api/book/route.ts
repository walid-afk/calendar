import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/auth'
import { createEvent, isSlotAvailable } from '@/lib/google'
import { DEFAULT_TZ } from '@/lib/time'

interface BookingRequest {
  calendarId: string
  start: string
  end: string
  customer: {
    id?: number
    email?: string
    name?: string
    phone?: string
  }
  items: Array<{
    productId: number
    title: string
    durationMinutes: number
    price: string
  }>
  notes?: string
}

async function handler(req: NextRequest) {
  try {
    const body: BookingRequest = await req.json()
    
    const { calendarId, start, end, customer, items, notes } = body

    // Vérifier que le créneau est disponible
    const isAvailable = await isSlotAvailable(calendarId, start, end)
    if (!isAvailable) {
      return Response.json(
        { error: 'Créneau non disponible' },
        { status: 409 }
      )
    }

    // Créer l'événement Google Calendar
    const event = await createEvent(calendarId, {
      start: { dateTime: start, timeZone: DEFAULT_TZ },
      end: { dateTime: end, timeZone: DEFAULT_TZ },
      summary: `RDV - ${customer.name || customer.email}`,
      description: `Client: ${customer.name || customer.email}\nTéléphone: ${customer.phone || 'Non renseigné'}\n\nServices:\n${items.map(item => `- ${item.title} (${item.durationMinutes}min) - ${item.price}€`).join('\n')}\n\nTotal: ${items.reduce((sum, item) => sum + parseFloat(item.price), 0).toFixed(2)}€${notes ? `\n\nNotes: ${notes}` : ''}`,
      attendees: [{ email: customer.email || customer.name || 'client@example.com' }]
    })

    return Response.json({
      ok: true,
      eventId: event.id,
      htmlLink: event.htmlLink,
      message: `Réservation confirmée pour ${customer.name || customer.email}`
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la réservation' },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)

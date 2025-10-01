'use client'

/**
 * DayCalendarView - Vue calendrier jour avec colonnes employés et drag & drop
 * 
 * Fonctionnalités :
 * - Affichage d'une journée avec colonnes par employé
 * - Intégration FreeBusy pour les créneaux occupés
 * - Drag & drop avec dnd-kit (snap 15min, contraintes)
 * - Validation des règles métier en temps réel
 * - Support clavier et tactile
 * 
 * Test DND local :
 * 1. Sélectionner une prestation dans le panier
 * 2. Glisser le bloc sur le calendrier
 * 3. Vérifier le snap aux 15 minutes
 * 4. Tester les contraintes (hors heures, conflits)
 * 5. Utiliser les flèches clavier pour navigation
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  useDroppable
} from '@dnd-kit/core'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { 
  pixelsToTime, 
  timeToPixels, 
  computePxPerMinute, 
  hasConflict, 
  isBeforeLeadTime,
  roundToStep,
  clampToOpening,
  type Busy
} from '@/lib/slots'
import { dayjs as timeDayjs, DEFAULT_TZ } from '@/lib/time'
import EventBlock from './EventBlock'
import UnavailableBlock from './UnavailableBlock'

dayjs.extend(utc)
dayjs.extend(timezone)

const DEFAULT_OPENING = process.env.DEFAULT_OPENING || '09:00-19:00'
const MIN_LEAD_MINUTES = parseInt(process.env.MIN_LEAD_MINUTES || '60')
const POST_BOOK_BUFFER_MINUTES = parseInt(process.env.POST_BOOK_BUFFER_MINUTES || '5')
const SLOT_STEP_MINUTES = parseInt(process.env.SLOT_STEP_MINUTES || '15')

interface Service {
  title: string
  variantId: string
  durationMin: number
}

interface ValidatedBlock {
  id: string
  title: string
  services: Service[]
  durationMin: number
}

interface Employee {
  id: string
  label: string
  avatarUrl?: string
}

interface BusySegment {
  start: string
  end: string
}

interface Event {
  id: string
  title: string
  start: string
  end: string
  customer?: {
    name: string
    email: string
  }
}

interface DayCalendarViewProps {
  date: string
  employees: Employee[]
  busySegments: BusySegment[]
  events: Event[]
  onDateChange: (date: string) => void
  onBookingConfirm?: (booking: {
    employeeId: string
    start: string
    end: string
    services: Service[]
  }) => void
  onFreeBusyLoad?: (date: string, employeeIds: string[]) => Promise<BusySegment[]>
  allowCrossEmployee?: boolean
}


// Droppable time cell component
function DroppableTimeCell({ 
  employeeId,
  date, 
  timeSlot, 
  isAvailable, 
  onDrop 
}: { 
  employeeId: string
  date: string
  timeSlot: { time: string; y: number }
  isAvailable: boolean
  onDrop: (employeeId: string, time: string) => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `timecell:${employeeId}:${date}:${timeSlot.time}`,
    data: { employeeId, time: timeSlot.time, date }
  })

  return (
    <div
      ref={setNodeRef}
      className={`absolute h-4 transition-colors ${
        isOver && isAvailable 
          ? 'bg-blue-100 border-2 border-blue-400' 
          : isAvailable 
            ? 'hover:bg-blue-50' 
            : 'bg-gray-100'
      }`}
      style={{
        top: timeSlot.y + 40,
        height: 60, // 15 minutes = 60px
        left: 0,
        right: 0
      }}
      onClick={() => isAvailable && onDrop(employeeId, timeSlot.time)}
    />
  )
}

// Drag overlay component
function BookingDragOverlay({ block, isValid }: { block: ValidatedBlock; isValid: boolean }) {
  return (
    <div
      className={`border-2 rounded-lg p-3 shadow-lg ${
        isValid 
          ? 'bg-white border-blue-400 text-gray-800' 
          : 'bg-red-100 border-red-400 text-red-800'
      }`}
    >
      <div className="text-sm font-medium">{block.title}</div>
      <div className="text-xs opacity-90">{block.durationMin} min</div>
      {!isValid && (
        <div className="text-xs text-red-600 mt-1">
          Zone indisponible
        </div>
      )}
    </div>
  )
}

export default function DayCalendarView({
  date,
  employees,
  busySegments,
  events,
  onDateChange,
  onBookingConfirm,
  onFreeBusyLoad,
  allowCrossEmployee = false
}: DayCalendarViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dropValid, setDropValid] = useState(true)
  const [hoveredCell, setHoveredCell] = useState<{ employeeId: string; time: string } | null>(null)
  const [freeBusyData, setFreeBusyData] = useState<BusySegment[]>([])
  const [loading, setLoading] = useState(false)
  
  const timelineRef = useRef<HTMLDivElement>(null)
  
  const containerHeight = 600
  const headerHeight = 40

  // Compute pixels per minute for the calendar layout
  const pxPerMinute = useMemo(() => 
    computePxPerMinute(DEFAULT_OPENING, containerHeight, headerHeight), 
    [containerHeight, headerHeight]
  )

  // Generate time slots
  const timeSlots = useMemo(() => {
    const [startTime, endTime] = DEFAULT_OPENING.split('-')
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const slots = []
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += SLOT_STEP_MINUTES) {
        if (hour === endHour && min >= endMin) break
        
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
        const minutes = hour * 60 + min - (startHour * 60 + startMin)
        const y = minutes * pxPerMinute
        
        slots.push({
          time,
          y,
          label: min === 0 ? time : null
        })
      }
    }
    return slots
  }, [pxPerMinute])

  // Convert events to Busy format for conflict checking
  const busyEvents: Busy[] = useMemo(() => [
    ...busySegments,
    ...freeBusyData,
    ...events.map(event => ({ start: event.start, end: event.end }))
  ], [busySegments, freeBusyData, events])

  // Load FreeBusy data
  const loadFreeBusyData = useCallback(async () => {
    if (!onFreeBusyLoad || employees.length === 0) return
    
    setLoading(true)
    try {
      const employeeIds = employees.map(emp => emp.id)
      const data = await onFreeBusyLoad(date, employeeIds)
      setFreeBusyData(data)
    } catch (error) {
      console.error('Erreur lors du chargement FreeBusy:', error)
      setFreeBusyData([])
    } finally {
      setLoading(false)
    }
  }, [onFreeBusyLoad, date, employees])

  // Load FreeBusy data on mount and when dependencies change
  useEffect(() => {
    loadFreeBusyData()
  }, [loadFreeBusyData])

  // Handle time cell drop (placeholder for non-DND interactions)
  const handleTimeCellDrop = useCallback((employeeId: string, time: string) => {
    console.log('Time cell clicked:', employeeId, time)
    // This could be used for click-based booking if needed
  }, [])

  return (
    <div className="relative">
      {/* Conteneur calendrier stylé */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* En-tête avec la date centrée */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {dayjs(date).format('dddd DD MMMM YYYY')}
          </h2>
            {loading && (
              <div className="text-sm text-gray-500 mt-2">Chargement des créneaux...</div>
            )}
        </div>

        {/* Navigation de date */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onDateChange(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'))}
            className="p-3 rounded-xl hover:bg-gray-100 transition-colors"
            title="Jour précédent"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          
          <div className="text-sm text-gray-500">
            Glissez votre bloc sur un créneau disponible
          </div>
          
          <button
            onClick={() => onDateChange(dayjs(date).add(1, 'day').format('YYYY-MM-DD'))}
            className="p-3 rounded-xl hover:bg-gray-100 transition-colors"
            title="Jour suivant"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Timeline principale */}
        <div className="relative border border-gray-200 rounded-xl overflow-hidden">
            <div
              ref={timelineRef}
              className="relative"
              style={{ height: containerHeight }}
        >
          {/* En-tête de la grille */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4">
                <div className="w-20 text-sm font-medium text-gray-600">Heure</div>
                {employees.map(employee => (
                  <div key={employee.id} className="flex-1 text-sm font-medium text-gray-600 text-center">
                    {employee.label}
                  </div>
                ))}
          </div>

          {/* Lignes de créneaux horaires */}
          {timeSlots.map((slot, index) => (
            <div
              key={slot.time}
              className="absolute left-0 right-0 border-b border-gray-100"
              style={{
                    top: slot.y + headerHeight,
                    height: 60 // 15 minutes = 60px
              }}
            >
              {/* Label d'heure */}
              {slot.label && (
                    <div className="absolute left-0 top-0 w-20 h-full flex items-center justify-center text-sm text-gray-500 bg-white border-r border-gray-200">
                  {slot.label}
                </div>
              )}
            </div>
          ))}

              {/* Colonnes employés avec cellules droppables */}
              {employees.map((employee, empIndex) => (
                <div
                  key={employee.id}
                  className="absolute top-0 bottom-0 border-r border-gray-200 last:border-r-0"
                  style={{
                    left: 80 + (empIndex * (100 / employees.length)) + '%',
                    width: (100 / employees.length) + '%'
                  }}
                >
                  {/* Cellules droppables pour chaque créneau */}
                  {timeSlots.map((slot) => {
                    const isAvailable = !busyEvents.some(event => {
                      const eventStart = timeDayjs.tz(event.start, DEFAULT_TZ)
                      const eventEnd = timeDayjs.tz(event.end, DEFAULT_TZ)
                      const slotStart = timeDayjs.tz(`${date}T${slot.time}:00`, DEFAULT_TZ)
                      const slotEnd = slotStart.add(SLOT_STEP_MINUTES, 'minutes')
                      
                      return slotStart.isBefore(eventEnd) && slotEnd.isAfter(eventStart)
                    })

                    return (
                      <DroppableTimeCell
                        key={`cell-${employee.id}-${slot.time}`}
                        employeeId={employee.id}
                        date={date}
                        timeSlot={slot}
                        isAvailable={isAvailable}
                        onDrop={handleTimeCellDrop}
                      />
                    )
                  })}

                  {/* Segments indisponibles pour cet employé */}
                  {freeBusyData
                    .filter(segment => {
                      // Filter segments for this employee (you'd need employee-specific data)
                      return true // For now, show all segments
                    })
                    .map((segment, index) => {
                      const startTime = timeDayjs.tz(segment.start, DEFAULT_TZ)
                      const endTime = timeDayjs.tz(segment.end, DEFAULT_TZ)
                      const startMinutes = startTime.hour() * 60 + startTime.minute() - (9 * 60) // 9:00 offset
                      const endMinutes = endTime.hour() * 60 + endTime.minute() - (9 * 60)
                      const top = startMinutes * pxPerMinute + headerHeight
                      const height = (endMinutes - startMinutes) * pxPerMinute
            
            return (
              <UnavailableBlock
                          key={`busy-${employee.id}-${index}`}
                segment={segment}
                style={{
                  position: 'absolute',
                            top,
                            left: 0,
                            height,
                            width: '100%'
                }}
              />
            )
          })}

                  {/* Événements existants pour cet employé */}
                  {events
                    .filter(event => {
                      // Filter events for this employee (you'd need employee-specific data)
                      return true // For now, show all events
                    })
                    .map(event => {
                      const startTime = timeDayjs.tz(event.start, DEFAULT_TZ)
                      const endTime = timeDayjs.tz(event.end, DEFAULT_TZ)
                      const startMinutes = startTime.hour() * 60 + startTime.minute() - (9 * 60)
                      const endMinutes = endTime.hour() * 60 + endTime.minute() - (9 * 60)
                      const top = startMinutes * pxPerMinute + headerHeight
                      const height = (endMinutes - startMinutes) * pxPerMinute
            
            return (
              <EventBlock
                key={event.id}
                event={event}
                style={{
                  position: 'absolute',
                            top,
                            left: 0,
                            height,
                            width: '100%'
                }}
              />
            )
          })}
                </div>
              ))}

              {/* Hovered cell indicator */}
              {hoveredCell && (
                <div
                  className="absolute w-full h-0.5 bg-blue-400 z-20 pointer-events-none"
              style={{
                    top: (timeSlots.find(slot => slot.time === hoveredCell.time)?.y || 0) + headerHeight,
                    left: 60 + ((employees.findIndex(emp => emp.id === hoveredCell.employeeId) || 0) * (100 / employees.length)) + '%',
                    width: (100 / employees.length) + '%'
              }}
            />
          )}
        </div>
      </div>

        {/* Légende */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span>Événements réservés</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-800 border border-gray-600 rounded"></div>
            <span>Zones indisponibles</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-blue-300 rounded"></div>
            <span>Nouveau rendez-vous</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Créneaux libres</span>
          </div>
        </div>
      </div>
    </div>
  )
}
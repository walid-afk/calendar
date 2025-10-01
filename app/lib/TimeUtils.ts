import dayjs from 'dayjs'

export class TimeUtils {
  // Configuration de la timeline
  static readonly START_HOUR = 8 // 08:00
  static readonly END_HOUR = 20 // 20:00
  static readonly PX_PER_MIN = 2 // 2 pixels par minute
  static readonly SLOT_DURATION = 15 // Durée d'un créneau en minutes

  /**
   * Convertit une heure (HH:MM) en position Y en pixels
   */
  static timeToPixel(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    const totalMinutes = (hours - this.START_HOUR) * 60 + minutes
    return totalMinutes * this.PX_PER_MIN
  }

  /**
   * Convertit une position Y en pixels en heure (HH:MM) avec snap 15min
   */
  static pixelToTime(y: number): string | null {
    const totalMinutes = Math.round(y / this.PX_PER_MIN)
    const hours = Math.floor(totalMinutes / 60) + this.START_HOUR
    const minutes = totalMinutes % 60

    // Vérifier que l'heure est dans la plage valide
    if (hours < this.START_HOUR || hours >= this.END_HOUR) {
      return null
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  /**
   * Snap une heure au créneau de 15min le plus proche
   */
  static snapToQuarterHour(time: string): string {
    const [hours, minutes] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes
    const snappedMinutes = Math.round(totalMinutes / this.SLOT_DURATION) * this.SLOT_DURATION
    const snappedHours = Math.floor(snappedMinutes / 60)
    const snappedMins = snappedMinutes % 60
    
    return `${snappedHours.toString().padStart(2, '0')}:${snappedMins.toString().padStart(2, '0')}`
  }

  /**
   * Convertit une durée en minutes en hauteur en pixels
   */
  static durationToHeight(durationMinutes: number): number {
    return durationMinutes * this.PX_PER_MIN
  }

  /**
   * Snap une position Y au créneau de 15min le plus proche
   */
  static snapToSlot(y: number): number {
    const totalMinutes = Math.round(y / this.PX_PER_MIN)
    const snappedMinutes = Math.round(totalMinutes / this.SLOT_DURATION) * this.SLOT_DURATION
    return snappedMinutes * this.PX_PER_MIN
  }

  /**
   * Génère la liste des créneaux horaires pour la timeline
   */
  static generateTimeSlots(): Array<{ time: string; label: string; y: number }> {
    const slots: Array<{ time: string; label: string; y: number }> = []
    
    for (let hour = this.START_HOUR; hour < this.END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += this.SLOT_DURATION) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const y = this.timeToPixel(time)
        
        // Afficher le label seulement pour les heures pleines
        const label = minute === 0 ? time : ''
        
        slots.push({ time, label, y })
      }
    }
    
    return slots
  }

  /**
   * Vérifie si une heure est dans la plage valide
   */
  static isValidTime(time: string): boolean {
    const [hours, minutes] = time.split(':').map(Number)
    return hours >= this.START_HOUR && hours < this.END_HOUR && minutes % this.SLOT_DURATION === 0
  }

  /**
   * Calcule la position et la hauteur d'un événement
   */
  static getEventPosition(startTime: string, endTime: string): { top: number; height: number } {
    const startY = this.timeToPixel(startTime)
    const endY = this.timeToPixel(endTime)
    
    return {
      top: startY,
      height: endY - startY
    }
  }

  /**
   * Vérifie si deux plages horaires se chevauchent
   */
  static hasOverlap(
    start1: string, end1: string,
    start2: string, end2: string
  ): boolean {
    const s1 = dayjs(`2000-01-01T${start1}`)
    const e1 = dayjs(`2000-01-01T${end1}`)
    const s2 = dayjs(`2000-01-01T${start2}`)
    const e2 = dayjs(`2000-01-01T${end2}`)
    
    return s1.isBefore(e2) && e1.isAfter(s2)
  }

  /**
   * Vérifie si un intervalle [start, end) intersecte avec des segments busy
   */
  static hasCollision(
    start: string,
    end: string,
    busySegments: Array<{ start: string; end: string }>
  ): boolean {
    return busySegments.some(segment => {
      const segmentStart = dayjs(segment.start).format('HH:mm')
      const segmentEnd = dayjs(segment.end).format('HH:mm')
      return this.hasOverlap(start, end, segmentStart, segmentEnd)
    })
  }

  /**
   * Formate une durée en minutes en texte lisible
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`
    }
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (remainingMinutes === 0) {
      return `${hours}h`
    }
    
    return `${hours}h${remainingMinutes}min`
  }

  /**
   * Calcule la hauteur totale de la timeline en pixels
   */
  static getTimelineHeight(): number {
    const totalMinutes = (this.END_HOUR - this.START_HOUR) * 60
    return totalMinutes * this.PX_PER_MIN
  }

  /**
   * Convertit un timestamp en heure avec snap 15min
   */
  static timestampToSnappedTime(timestamp: number): string {
    const date = new Date(timestamp)
    const time = date.toTimeString().slice(0, 5)
    return this.snapToQuarterHour(time)
  }
}
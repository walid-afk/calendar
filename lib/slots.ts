import { dayjs } from '@/lib/time';

export type Busy = { 
  start: string; 
  end: string;
  title?: string;
  summary?: string;
};
export type Cell = { start: string; end: string; idx: number; busy: boolean };

const DEFAULT_TZ = process.env.DEFAULT_TZ || 'Europe/Paris';
const SLOT_STEP_MINUTES = parseInt(process.env.SLOT_STEP_MINUTES || '15');
const MIN_LEAD_MINUTES = parseInt(process.env.MIN_LEAD_MINUTES || '60');
const POST_BOOK_BUFFER_MINUTES = parseInt(process.env.POST_BOOK_BUFFER_MINUTES || '5');

export function buildDayCells(ymd: string, opening: string, stepMin: number, busies: Busy[]) {
  const [o,c] = opening.split('-');
  const start = dayjs.tz(`${ymd}T${o}:00`, process.env.DEFAULT_TZ || 'Europe/Paris');
  const end   = dayjs.tz(`${ymd}T${c}:00`, process.env.DEFAULT_TZ || 'Europe/Paris');
  const cells: Cell[] = [];
  let idx = 0;
  for (let t = start; t.add(stepMin,'minute').isBefore(end) || t.add(stepMin,'minute').isSame(end); t = t.add(stepMin,'minute')) {
    const s = t; const e = t.add(stepMin,'minute');
    if (e.isAfter(end)) break;
    const b = busies.some(b => s.isBefore(dayjs(b.end)) && e.isAfter(dayjs(b.start)));
    cells.push({ start: s.toISOString(), end: e.toISOString(), idx: idx++, busy: b });
  }
  return cells;
}

export function findValidStarts(
  cells: Cell[],
  totalMin: number,
  stepMin: number,
  leadMin: number,
  postBufferMin: number
) {
  const need = Math.ceil(totalMin / stepMin);
  const bufferCells = Math.ceil((postBufferMin || 0) / stepMin);
  const nowLead = dayjs().add(leadMin, 'minute');

  const valid: number[] = [];
  for (let i=0; i+need+bufferCells<=cells.length; i++) {
    if (dayjs(cells[i].start).isBefore(nowLead)) continue;
    let ok = true;
    for (let k=0; k<need; k++) {
      const c = cells[i+k];
      if (!c || c.busy) { ok=false; break; }
      if (k>0 && cells[i+k-1].end !== c.start) { ok=false; break; }
    }
    if (ok && bufferCells>0) {
      for (let b=0;b<bufferCells;b++) {
        const c = cells[i+need+b];
        if (!c || c.busy) { ok=false; break; }
      }
    }
    if (ok) valid.push(i);
  }
  return { valid, need, needWithBuffer: need+bufferCells };
}

/**
 * Round a date to the nearest step interval
 */
export function roundToStep(date: dayjs.Dayjs, stepMin: number = SLOT_STEP_MINUTES): dayjs.Dayjs {
  const minutes = date.minute()
  const roundedMinutes = Math.round(minutes / stepMin) * stepMin
  return date.minute(roundedMinutes).second(0).millisecond(0)
}

/**
 * Clamp a date to opening hours
 */
export function clampToOpening(date: dayjs.Dayjs, opening: string = '09:00-19:00'): dayjs.Dayjs {
  const [startTime, endTime] = opening.split('-')
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const dayStart = date.hour(startHour).minute(startMin).second(0).millisecond(0)
  const dayEnd = date.hour(endHour).minute(endMin).second(0).millisecond(0)
  
  if (date.isBefore(dayStart)) return dayStart
  if (date.isAfter(dayEnd)) return dayEnd
  return date
}

/**
 * Check if a time slot has conflicts with existing events
 * Note: No buffer checks as per requirements
 */
export function hasConflict(
  events: Busy[],
  start: string,
  end: string,
  bufferMin: number = 0 // No buffer by default
): boolean {
  // Les événements viennent en UTC (ISO), les convertir
  const startTime = dayjs(start).tz(DEFAULT_TZ)
  const endTime = dayjs(end).tz(DEFAULT_TZ)
  
  console.log('hasConflict check:', {
    start,
    end,
    startTime: startTime.format('YYYY-MM-DD HH:mm:ss Z'),
    endTime: endTime.format('YYYY-MM-DD HH:mm:ss Z'),
    startValid: startTime.isValid(),
    endValid: endTime.isValid(),
    eventsCount: events.length
  })
  
  return events.some(event => {
    // Les événements viennent en UTC, les convertir en timezone local
    const eventStart = dayjs(event.start).tz(DEFAULT_TZ)
    const eventEnd = dayjs(event.end).tz(DEFAULT_TZ)
    
    const hasOverlap = startTime.isBefore(eventEnd) && endTime.isAfter(eventStart)
    if (hasOverlap) {
      console.log('Conflict found with event:', {
        eventStart: eventStart.format('YYYY-MM-DD HH:mm:ss Z'),
        eventEnd: eventEnd.format('YYYY-MM-DD HH:mm:ss Z')
      })
    }
    
    // Check for overlap only (no buffer)
    return hasOverlap
  })
}

/**
 * Check if a start time is before the minimum lead time
 */
export function isBeforeLeadTime(start: string, leadMin: number = MIN_LEAD_MINUTES): boolean {
  const startTime = dayjs.tz(start, DEFAULT_TZ)
  const now = dayjs.tz(undefined, DEFAULT_TZ)
  const minStartTime = now.add(leadMin, 'minute')
  
  return startTime.isBefore(minStartTime)
}

/**
 * Convert pixels to time based on calendar layout
 */
export function pixelsToTime(pixels: number, pxPerMinute: number, headerHeight: number = 40): dayjs.Dayjs {
  const adjustedPixels = pixels - headerHeight
  const minutes = Math.max(0, adjustedPixels / pxPerMinute)
  return dayjs.tz(undefined, DEFAULT_TZ).startOf('day').add(minutes, 'minute')
}

/**
 * Convert time to pixels based on calendar layout
 */
export function timeToPixels(time: dayjs.Dayjs, pxPerMinute: number, headerHeight: number = 40): number {
  const minutes = time.diff(time.startOf('day'), 'minute')
  return minutes * pxPerMinute + headerHeight
}

/**
 * Compute pixels per minute for calendar layout
 */
export function computePxPerMinute(opening: string = '09:00-19:00', containerHeight: number = 600, headerHeight: number = 40): number {
  const [startTime, endTime] = opening.split('-')
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
  const availableHeight = containerHeight - headerHeight
  
  return availableHeight / totalMinutes
}
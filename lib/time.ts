import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
dayjs.extend(utc); dayjs.extend(tz);

export const DEFAULT_TZ = process.env.DEFAULT_TZ || 'Europe/Paris';
export const DEFAULT_OPENING = '09:00-19:00';
export const SLOT_STEP_MINUTES = 15;
export const MIN_LEAD_MINUTES = 60;

export function parseYMD(ymd: string) {
  return dayjs.tz(`${ymd}T00:00:00`, DEFAULT_TZ);
}

export function ymdWith(ymd: string, hhmm: string) {
  const [h,m] = hhmm.split(':').map(Number);
  return parseYMD(ymd).hour(h).minute(m).second(0).millisecond(0);
}

export function isoZ(d: dayjs.Dayjs) { 
  return d.toISOString(); 
}

/**
 * Round time to nearest step (15 minutes by default)
 */
export function roundToStep(date: dayjs.Dayjs, stepMinutes: number = SLOT_STEP_MINUTES): dayjs.Dayjs {
  const minutes = date.minute();
  const roundedMinutes = Math.round(minutes / stepMinutes) * stepMinutes;
  return date.minute(roundedMinutes).second(0).millisecond(0);
}

/**
 * Clamp time to opening hours
 */
export function clampToOpening(date: dayjs.Dayjs, opening: string = DEFAULT_OPENING): dayjs.Dayjs {
  const [openTime, closeTime] = opening.split('-');
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;
  const currentMinutes = date.hour() * 60 + date.minute();
  
  if (currentMinutes < openMinutes) {
    return date.hour(openHour).minute(openMin);
  } else if (currentMinutes > closeMinutes) {
    return date.hour(closeHour).minute(closeMin);
  }
  
  return date;
}

/**
 * Check if time is before minimum lead time
 */
export function isBeforeLeadTime(start: dayjs.Dayjs, leadMinutes: number = MIN_LEAD_MINUTES): boolean {
  const now = dayjs().tz(DEFAULT_TZ);
  const minStart = now.add(leadMinutes, 'minute');
  return start.isBefore(minStart);
}

/**
 * Get opening hours as minutes from midnight
 */
export function getOpeningMinutes(opening: string = DEFAULT_OPENING): { open: number; close: number } {
  const [openTime, closeTime] = opening.split('-');
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  return {
    open: openHour * 60 + openMin,
    close: closeHour * 60 + closeMin
  };
}

/**
 * Format time as HH:mm
 */
export function formatTime(date: dayjs.Dayjs): string {
  return date.format('HH:mm');
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: dayjs.Dayjs): string {
  return date.format('YYYY-MM-DD');
}

export { dayjs };

import { Modifier } from '@dnd-kit/core'

/**
 * Snap to 15-minute intervals
 * @param pxPerMinute - Pixels per minute in the calendar grid
 */
export const snapTo15min = (pxPerMinute: number): Modifier => ({ transform }) => {
  if (!transform || !pxPerMinute || !isFinite(pxPerMinute) || pxPerMinute <= 0) {
    return transform;
  }
  const stepMinutes = 15;
  const stepPixels = stepMinutes * pxPerMinute;
  const minutes = transform.y / pxPerMinute;
  const snapped = Math.round(minutes / stepMinutes) * stepMinutes;
  return { ...transform, y: snapped * pxPerMinute };
}

/**
 * Legacy alias for backward compatibility
 */
export const snapToStep = snapTo15min;

/**
 * Restrict movement to vertical axis only
 */
export const restrictToVerticalAxis: Modifier = ({ transform }) => {
  return {
    ...transform,
    x: 0
  }
}

/**
 * Restrict movement within calendar bounds
 * @param opening - Opening hours string (e.g., "09:00-19:00") or object with open/close times
 * @param pxPerMinute - Pixels per minute in the calendar grid
 * @param headerHeight - Height of the header (default 0)
 */
export const restrictToCalendarBounds = (
  opening: string | { open: string; close: string },
  pxPerMinute: number,
  headerHeight = 0
): Modifier => ({ transform }) => {
  if (!transform || !pxPerMinute || !isFinite(pxPerMinute) || pxPerMinute <= 0) {
    return transform;
  }
  
  // Parse opening hours
  let openMinutes: number;
  let closeMinutes: number;
  
  if (typeof opening === 'string') {
    // Format: "09:00-19:00"
    const [openTime, closeTime] = opening.split('-');
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    openMinutes = openHour * 60 + openMin;
    closeMinutes = closeHour * 60 + closeMin;
  } else {
    // Format: { open: "09:00", close: "19:00" }
    const [openHour, openMin] = opening.open.split(':').map(Number);
    const [closeHour, closeMin] = opening.close.split(':').map(Number);
    openMinutes = openHour * 60 + openMin;
    closeMinutes = closeHour * 60 + closeMin;
  }
  
  // Calculate bounds in pixels
  const totalHeight = (closeMinutes - openMinutes) * pxPerMinute;
  
  // Clamp transform.y within opening hours
  const minY = headerHeight;
  const maxY = headerHeight + totalHeight;
  
  return {
    ...transform,
    y: Math.max(minY, Math.min(transform.y, maxY))
  };
}

/**
 * Restrict movement within staff column bounds
 * @param columnX - X position of the column
 * @param columnWidth - Width of the column
 */
export const restrictToColumnBounds = (
  columnX: number,
  columnWidth: number
): Modifier => {
  return ({ transform }) => {
    return {
      ...transform,
      x: Math.max(columnX, Math.min(transform.x, columnX + columnWidth))
    }
  }
}

/**
 * Combined modifier for calendar drag & drop
 * @param params - Configuration parameters
 */
export const createCalendarModifier = (params: {
  pxPerMinute: number
  opening: { open: string; close: string }
  headerHeight?: number
  columnX?: number
  columnWidth?: number
}): Modifier => {
  const { pxPerMinute, opening, headerHeight = 0, columnX, columnWidth } = params

  return ({ transform }) => {
    if (!transform || !pxPerMinute || !isFinite(pxPerMinute) || pxPerMinute <= 0) {
      return transform;
    }

    let newTransform = { ...transform }

    // Restrict to vertical axis
    newTransform.x = 0

    // Snap to 15-minute intervals
    const stepMinutes = 15
    const minutes = newTransform.y / pxPerMinute
    const snapped = Math.round(minutes / stepMinutes) * stepMinutes
    newTransform.y = snapped * pxPerMinute

    // Restrict to calendar bounds
    const [openHour, openMin] = opening.open.split(':').map(Number)
    const [closeHour, closeMin] = opening.close.split(':').map(Number)
    const openMinutes = openHour * 60 + openMin
    const closeMinutes = closeHour * 60 + closeMin
    const totalHeight = (closeMinutes - openMinutes) * pxPerMinute
    
    const minY = headerHeight
    const maxY = headerHeight + totalHeight
    newTransform.y = Math.max(minY, Math.min(newTransform.y, maxY))

    // Restrict to column bounds if specified
    if (columnX !== undefined && columnWidth !== undefined) {
      newTransform.x = Math.max(columnX, Math.min(newTransform.x, columnX + columnWidth))
    }

    return newTransform
  }
}
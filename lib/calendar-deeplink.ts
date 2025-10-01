/**
 * Google Calendar deep linking utilities
 */

export const WEB_CAL = 'https://calendar.google.com/calendar/u/0/r'
export const ANDROID_INTENT = 'intent://calendar/u/0/r#Intent;scheme=https;package=com.google.android.calendar;end'
export const IOS_SCHEME = 'googlecalendar://'

/**
 * Try to open Google Calendar with device-aware deep linking
 * @param device - Device type
 */
export function tryOpenCalendar(device: 'desktop' | 'android' | 'ios'): void {
  if (device === 'desktop') {
    window.open(WEB_CAL, '_blank', 'noopener,noreferrer')
    return
  }

  const target = device === 'android' ? ANDROID_INTENT : IOS_SCHEME
  const fallback = setTimeout(() => {
    window.location.href = WEB_CAL
  }, 1000)

  try {
    window.location.href = target
  } catch {
    clearTimeout(fallback)
    window.location.href = WEB_CAL
  }
}

/**
 * Open Google Calendar with automatic device detection
 */
export function openGoogleCalendar(): void {
  if (typeof window === 'undefined') return

  const userAgent = window.navigator.userAgent.toLowerCase()
  
  if (/android/.test(userAgent)) {
    tryOpenCalendar('android')
  } else if (/iphone|ipad|ipod/.test(userAgent)) {
    tryOpenCalendar('ios')
  } else {
    tryOpenCalendar('desktop')
  }
}

/**
 * Generate Google Calendar URL for specific date
 * @param date - Date string in YYYY-MM-DD format
 */
export function getGoogleCalendarUrl(date?: string): string {
  if (date) {
    return `${WEB_CAL}?date=${date}`
  }
  return WEB_CAL
}

/**
 * Generate Google Calendar URL for specific date range
 * @param startDate - Start date string in YYYY-MM-DD format
 * @param endDate - End date string in YYYY-MM-DD format
 */
export function getGoogleCalendarRangeUrl(startDate: string, endDate: string): string {
  return `${WEB_CAL}?date=${startDate}&end=${endDate}`
}

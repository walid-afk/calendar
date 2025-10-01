/**
 * Device detection utilities
 */

export interface DeviceInfo {
  isAndroid: boolean
  isIOS: boolean
  isMobile: boolean
  isDesktop: boolean
  isTablet: boolean
}

/**
 * Detect device type from user agent
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isAndroid: false,
      isIOS: false,
      isMobile: false,
      isDesktop: true,
      isTablet: false
    }
  }

  const userAgent = window.navigator.userAgent.toLowerCase()
  
  const isAndroid = /android/.test(userAgent)
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)/.test(userAgent)
  const isDesktop = !isMobile && !isTablet

  return {
    isAndroid,
    isIOS,
    isMobile,
    isDesktop,
    isTablet
  }
}

/**
 * Check if device is Android
 */
export function isAndroid(): boolean {
  return detectDevice().isAndroid
}

/**
 * Check if device is iOS
 */
export function isIOS(): boolean {
  return detectDevice().isIOS
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  return detectDevice().isMobile
}

/**
 * Check if device is desktop
 */
export function isDesktop(): boolean {
  return detectDevice().isDesktop
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  return detectDevice().isTablet
}

/**
 * Get device type as string
 */
export function getDeviceType(): 'desktop' | 'android' | 'ios' | 'mobile' | 'tablet' {
  const device = detectDevice()
  
  if (device.isAndroid) return 'android'
  if (device.isIOS) return 'ios'
  if (device.isTablet) return 'tablet'
  if (device.isMobile) return 'mobile'
  return 'desktop'
}

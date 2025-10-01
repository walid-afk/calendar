/**
 * Permission utilities for role-based access control
 */

export type UserRole = 'admin' | 'manager' | 'employee' | 'viewer'

export interface User {
  id: string
  role: UserRole
  name: string
  email: string
}

/**
 * Check if user can manage schedules
 * @param role - User role
 */
export function canManageSchedules(role: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

/**
 * Check if user can view schedules
 * @param role - User role
 */
export function canViewSchedules(role: UserRole): boolean {
  return ['admin', 'manager', 'employee'].includes(role)
}

/**
 * Check if user can manage employees
 * @param role - User role
 */
export function canManageEmployees(role: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

/**
 * Check if user can view employees
 * @param role - User role
 */
export function canViewEmployees(role: UserRole): boolean {
  return ['admin', 'manager', 'employee'].includes(role)
}

/**
 * Check if user can manage bookings
 * @param role - User role
 */
export function canManageBookings(role: UserRole): boolean {
  return ['admin', 'manager', 'employee'].includes(role)
}

/**
 * Check if user can view bookings
 * @param role - User role
 */
export function canViewBookings(role: UserRole): boolean {
  return ['admin', 'manager', 'employee', 'viewer'].includes(role)
}

/**
 * Check if user can access admin features
 * @param role - User role
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * Check if user can access manager features
 * @param role - User role
 */
export function isManager(role: UserRole): boolean {
  return role === 'admin' || role === 'manager'
}

/**
 * Get user role from context (placeholder - implement based on your auth system)
 */
export function getCurrentUserRole(): UserRole {
  // TODO: Implement based on your authentication system
  // This is a placeholder that returns 'admin' for now
  return 'admin'
}

/**
 * Check if current user can manage schedules
 */
export function canCurrentUserManageSchedules(): boolean {
  return canManageSchedules(getCurrentUserRole())
}

/**
 * Check if current user can view schedules
 */
export function canCurrentUserViewSchedules(): boolean {
  return canViewSchedules(getCurrentUserRole())
}

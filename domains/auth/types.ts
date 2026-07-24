import type { User, UserRole } from '~/domains/users/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  cityCode: string
  role: Exclude<UserRole, 'admin'>
}

export interface AuthSession {
  id: string
  userId: string
  expiresAt: string
  createdAt: string
  isDemo: boolean
}

export interface AuthResult {
  session: AuthSession
  user: User
}

export interface RegistrationResult {
  auth: AuthResult | null
  confirmationRequired: boolean
}

export type AuthErrorCode
  = | 'invalid_credentials'
    | 'email_exists'
    | 'session_expired'
    | 'user_suspended'
    | 'email_confirmation_required'
    | 'weak_password'
    | 'invalid_reset_link'
    | 'unknown'

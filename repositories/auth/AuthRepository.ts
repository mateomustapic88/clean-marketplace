import type {
  AuthResult,
  RegistrationResult,
  LoginCredentials,
  RegisterInput,
} from '~/domains/auth/types'

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResult>
  register(input: RegisterInput): Promise<RegistrationResult>
  logout(): Promise<void>
  restoreSession(): Promise<AuthResult | null>
  requestPasswordReset(email: string): Promise<void>
  updatePassword(password: string): Promise<void>
}

import type {
  AuthResult,
  LoginCredentials,
  RegisterInput,
} from '~/domains/auth/types'

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResult>
  register(input: RegisterInput): Promise<AuthResult>
  logout(): Promise<void>
  restoreSession(): Promise<AuthResult | null>
  requestPasswordReset(email: string): Promise<void>
}

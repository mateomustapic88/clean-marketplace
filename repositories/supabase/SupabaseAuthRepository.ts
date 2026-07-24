import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js'
import type {
  AuthErrorCode,
  AuthResult,
  LoginCredentials,
  RegisterInput,
  RegistrationResult,
} from '~/domains/auth/types'
import { DomainError } from '~/domains/shared/errors'
import type { User } from '~/domains/users/types'
import type { AuthRepository } from '~/repositories/auth/AuthRepository'

const mapAuthError = (error: AuthError): AuthErrorCode => {
  if (error.code === 'invalid_credentials') return 'invalid_credentials'
  if (error.code === 'user_already_exists' || error.code === 'email_exists') return 'email_exists'
  if (error.code === 'weak_password') return 'weak_password'
  if (error.code === 'session_not_found' || error.code === 'refresh_token_not_found') return 'session_expired'
  return 'unknown'
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly appBaseUrl: string,
  ) {}

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    })
    if (error || !data.session) throw new DomainError(mapAuthError(error!), error?.message)
    return this.toAuthResult(data.session)
  }

  async register(input: RegisterInput): Promise<RegistrationResult> {
    const { data, error } = await this.client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: {
        emailRedirectTo: `${this.appBaseUrl}/auth/callback`,
        data: {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          phone: input.phone.trim(),
          city_code: input.cityCode,
          role: input.role,
        },
      },
    })
    if (error) throw new DomainError(mapAuthError(error), error.message)
    return {
      auth: data.session ? await this.toAuthResult(data.session) : null,
      confirmationRequired: !data.session,
    }
  }

  async logout(): Promise<void> {
    const { error } = await this.client.auth.signOut()
    if (error) throw new DomainError(mapAuthError(error), error.message)
  }

  async restoreSession(): Promise<AuthResult | null> {
    const { data, error } = await this.client.auth.getSession()
    if (error || !data.session) return null
    const { data: verified, error: verificationError } = await this.client.auth.getUser()
    if (verificationError || !verified.user) {
      await this.client.auth.signOut({ scope: 'local' })
      return null
    }
    return this.toAuthResult(data.session)
  }

  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.client.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${this.appBaseUrl}/nova-lozinka` },
    )
    if (error) throw new DomainError(mapAuthError(error), error.message)
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.client.auth.updateUser({ password })
    if (error) throw new DomainError(mapAuthError(error), error.message)
  }

  private async toAuthResult(session: Session): Promise<AuthResult> {
    const { data: profile, error } = await this.client
      .from('profiles')
      .select('id, role, status, display_name, avatar_path, is_demo, created_at, updated_at')
      .eq('id', session.user.id)
      .single()
    if (error || !profile) throw new DomainError<AuthErrorCode>('unknown', error?.message)
    if (profile.status === 'suspended') throw new DomainError<AuthErrorCode>('user_suspended')
    const user: User = {
      id: profile.id,
      email: session.user.email ?? '',
      displayName: profile.display_name,
      role: profile.role,
      status: profile.status,
      avatarSeed: profile.avatar_path ?? profile.id,
      isDemo: profile.is_demo,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    }
    return {
      user,
      session: {
        id: session.access_token.slice(-24),
        userId: user.id,
        createdAt: new Date(session.expires_at! * 1000 - session.expires_in * 1000).toISOString(),
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        isDemo: false,
      },
    }
  }
}

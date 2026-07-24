import { defineStore } from 'pinia'
import type {
  AuthErrorCode,
  AuthSession,
  LoginCredentials,
  RegisterInput,
} from '~/domains/auth/types'
import { DomainError } from '~/domains/shared/errors'
import type { User } from '~/domains/users/types'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)
  const user = ref<User | null>(null)
  const status = ref<'idle' | 'loading' | 'authenticated' | 'anonymous'>('idle')
  const errorCode = ref<AuthErrorCode | null>(null)
  const isRestored = ref(false)
  const registrationPending = ref(false)

  const isAuthenticated = computed(
    () => status.value === 'authenticated' && user.value !== null,
  )

  const repositories = () => useNuxtApp().$repositories

  const applyAuthResult = (
    result: Awaited<ReturnType<ReturnType<typeof repositories>['auth']['login']>>,
  ) => {
    session.value = result.session
    user.value = result.user
    status.value = 'authenticated'
    errorCode.value = null
  }

  const normalizeError = (error: unknown): AuthErrorCode => error instanceof DomainError
    ? error.code as AuthErrorCode
    : 'unknown'

  const login = async (credentials: LoginCredentials) => {
    status.value = 'loading'
    errorCode.value = null
    try {
      applyAuthResult(await repositories().auth.login(credentials))
      isRestored.value = true
      return true
    }
    catch (error) {
      session.value = null
      user.value = null
      status.value = 'anonymous'
      errorCode.value = normalizeError(error)
      return false
    }
  }

  const register = async (input: RegisterInput) => {
    status.value = 'loading'
    errorCode.value = null
    try {
      const result = await repositories().auth.register(input)
      registrationPending.value = result.confirmationRequired
      if (result.auth) {
        applyAuthResult(result.auth)
      }
      else {
        session.value = null
        user.value = null
        status.value = 'anonymous'
        errorCode.value = 'email_confirmation_required'
      }
      isRestored.value = true
      return true
    }
    catch (error) {
      session.value = null
      user.value = null
      status.value = 'anonymous'
      errorCode.value = normalizeError(error)
      return false
    }
  }

  const logout = async () => {
    status.value = 'loading'
    try {
      await repositories().auth.logout()
    }
    finally {
      session.value = null
      user.value = null
      status.value = 'anonymous'
      errorCode.value = null
      isRestored.value = true
    }
  }

  const restoreSession = async (force = false) => {
    if ((!force && isRestored.value) || status.value === 'loading') {
      return
    }

    status.value = 'loading'
    try {
      const result = await repositories().auth.restoreSession()
      if (result) {
        applyAuthResult(result)
      }
      else {
        session.value = null
        user.value = null
        status.value = 'anonymous'
      }
    }
    catch {
      session.value = null
      user.value = null
      status.value = 'anonymous'
      errorCode.value = 'session_expired'
    }
    finally {
      isRestored.value = true
    }
  }

  const requestPasswordReset = async (email: string) => {
    await repositories().auth.requestPasswordReset(email)
  }

  const updatePassword = async (password: string) => {
    await repositories().auth.updatePassword(password)
  }

  const clearError = () => {
    errorCode.value = null
  }

  const updateAccount = async (changes: Pick<User, 'email' | 'displayName' | 'avatarSeed'>) => {
    if (!user.value) return null
    const updatedUser = await repositories().users.updateUser({
      ...user.value,
      ...changes,
    })
    user.value = updatedUser
    return updatedUser
  }

  return {
    session,
    user,
    status,
    errorCode,
    isRestored,
    registrationPending,
    isAuthenticated,
    login,
    register,
    logout,
    restoreSession,
    requestPasswordReset,
    updatePassword,
    clearError,
    updateAccount,
  }
})

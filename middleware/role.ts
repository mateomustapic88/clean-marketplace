import type { UserRole } from '~/domains/users/types'
import { useAuthStore } from '~/stores/auth'
import { getAppRoute } from '~/utils/routes'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server && useRuntimeConfig().public.infrastructureMode === 'mock') return
  const nuxtApp = useNuxtApp()
  if (import.meta.client && nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
    return
  }

  const authStore = useAuthStore()
  await authStore.restoreSession(import.meta.client)
  if (!authStore.user) {
    return
  }

  const allowedRoles = to.meta.roles as UserRole[] | undefined
  if (allowedRoles?.length && !allowedRoles.includes(authStore.user.role)) {
    const { locale } = useI18n()
    return navigateTo(getAppRoute('forbidden', locale.value))
  }
})

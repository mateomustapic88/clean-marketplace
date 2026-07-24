import { useAuthStore } from '~/stores/auth'
import { getRoleDashboardRoute } from '~/utils/routes'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server && useRuntimeConfig().public.infrastructureMode === 'mock') return
  const nuxtApp = useNuxtApp()
  if (import.meta.client && nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
    return
  }

  const authStore = useAuthStore()
  await authStore.restoreSession(import.meta.client)
  if (authStore.user) {
    const { locale } = useI18n()
    return navigateTo(getRoleDashboardRoute(authStore.user.role, locale.value))
  }
})

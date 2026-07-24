import { useAuthStore } from '~/stores/auth'
import { getAppRoute, getLocaleFromPath } from '~/utils/routes'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server && useRuntimeConfig().public.infrastructureMode === 'mock') return
  const nuxtApp = useNuxtApp()
  if (import.meta.client && nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
    return
  }

  const authStore = useAuthStore()
  await authStore.restoreSession(import.meta.client)

  if (!authStore.isAuthenticated) {
    return navigateTo(getAppRoute('login', getLocaleFromPath(to.path)))
  }
})

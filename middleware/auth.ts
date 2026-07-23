import { useAuthStore } from '~/stores/auth'
import { getAppRoute } from '~/utils/routes'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) {
    return
  }

  const nuxtApp = useNuxtApp()
  if (nuxtApp.isHydrating && nuxtApp.payload.serverRendered) {
    return
  }

  const authStore = useAuthStore()
  await authStore.restoreSession()

  if (!authStore.isAuthenticated) {
    const { locale } = useI18n()
    return navigateTo(getAppRoute('login', locale.value))
  }
})

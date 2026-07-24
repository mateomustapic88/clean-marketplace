import { useAuthStore } from '~/stores/auth'
import { useSubscriptionStore } from '~/stores/subscription'
import { getAppRoute, getLocaleFromPath } from '~/utils/routes'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server && useRuntimeConfig().public.infrastructureMode === 'mock') return
  const capability = to.meta.subscriptionCapability
  if (!capability) return
  const auth = useAuthStore()
  await auth.restoreSession(import.meta.client)
  if (!auth.user || auth.user.role === 'admin') return
  const allowed = import.meta.server
    ? await useNuxtApp().$repositories.subscriptions.can(auth.user.id, auth.user.role, capability)
    : await (async () => {
        const subscriptions = useSubscriptionStore()
        await subscriptions.loadForUser(auth.user!.id, auth.user!.role)
        return subscriptions.capabilities[capability]
      })()
  if (!allowed) {
    return navigateTo(getAppRoute(
      auth.user.role === 'owner' ? 'ownerBilling' : 'cleanerBilling',
      getLocaleFromPath(to.path),
    ))
  }
})

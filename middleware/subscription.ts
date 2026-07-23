import { useAuthStore } from '~/stores/auth'
import { useSubscriptionStore } from '~/stores/subscription'
import { getAppRoute } from '~/utils/routes'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const capability = to.meta.subscriptionCapability
  if (!capability) return
  const auth = useAuthStore()
  await auth.restoreSession()
  if (!auth.user || auth.user.role === 'admin') return
  const subscriptions = useSubscriptionStore()
  await subscriptions.loadForUser(auth.user.id, auth.user.role)
  if (!subscriptions.capabilities[capability]) {
    const { locale } = useI18n()
    return navigateTo(getAppRoute(auth.user.role === 'owner' ? 'ownerBilling' : 'cleanerBilling', locale.value))
  }
})

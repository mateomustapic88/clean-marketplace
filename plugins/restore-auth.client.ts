import { useAuthStore } from '~/stores/auth'
import { useSubscriptionStore } from '~/stores/subscription'
import type { UserRole } from '~/domains/users/types'
import { getAppRoute, getRoleDashboardRoute } from '~/utils/routes'

export default defineNuxtPlugin(() => {
  onNuxtReady(async () => {
    const authStore = useAuthStore()
    await authStore.restoreSession()

    const route = useRoute()
    const middleware = Array.isArray(route.meta.middleware)
      ? route.meta.middleware
      : [route.meta.middleware]
    const requiresAuthentication = middleware.includes('auth')
    const isGuestOnly = middleware.includes('guest')
    const locale = route.path === '/en' || route.path.startsWith('/en/')
      ? 'en'
      : 'hr'

    if (requiresAuthentication && !authStore.isAuthenticated) {
      await navigateTo(getAppRoute('login', locale), { replace: true })
      return
    }

    if (isGuestOnly && authStore.user) {
      await navigateTo(
        getRoleDashboardRoute(authStore.user.role, locale),
        { replace: true },
      )
      return
    }

    const allowedRoles = route.meta.roles as UserRole[] | undefined
    if (
      requiresAuthentication
      && authStore.user
      && allowedRoles?.length
      && !allowedRoles.includes(authStore.user.role)
    ) {
      await navigateTo(getAppRoute('forbidden', locale), { replace: true })
      return
    }

    const capability = route.meta.subscriptionCapability
    if (authStore.user && authStore.user.role !== 'admin' && capability) {
      const subscriptions = useSubscriptionStore()
      await subscriptions.loadForUser(authStore.user.id, authStore.user.role)
      if (!subscriptions.capabilities[capability]) {
        await navigateTo(
          getAppRoute(
            authStore.user.role === 'owner' ? 'ownerBilling' : 'cleanerBilling',
            locale,
          ),
          { replace: true },
        )
      }
    }
  })
})

import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { getAppRoute, getLocaleFromPath } from '~/utils/routes'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.meta.requiresCompletedProfile) return
  if (import.meta.server && useRuntimeConfig().public.infrastructureMode === 'mock') return

  const authStore = useAuthStore()
  await authStore.restoreSession(import.meta.client)
  const user = authStore.user
  if (!user || user.role === 'admin') return

  const profile = import.meta.server
    ? await useNuxtApp().$repositories.users.getProfile(user.id)
    : await (async () => {
        const userStore = useUserStore()
        if (userStore.profile?.userId !== user.id) {
          await userStore.loadCurrentProfile(user.id)
        }
        return userStore.profile
      })()

  if (
    profile
    && 'onboardingCompleted' in profile
    && profile.onboardingCompleted
  ) {
    return
  }

  const locale = getLocaleFromPath(to.path)
  return navigateTo({
    path: getAppRoute(
      user.role === 'owner' ? 'ownerOnboarding' : 'cleanerOnboarding',
      locale,
    ),
    query: { reason: 'profile_required' },
  })
})

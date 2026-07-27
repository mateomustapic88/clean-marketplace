import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { getAppRoute } from '~/utils/routes'

export const useProfileCompletionGuard = () => {
  const { locale } = useI18n()
  const authStore = useAuthStore()
  const userStore = useUserStore()

  const onboardingPath = computed(() => {
    if (authStore.user?.role === 'owner') {
      return getAppRoute('ownerOnboarding', locale.value)
    }
    if (authStore.user?.role === 'cleaner') {
      return getAppRoute('cleanerOnboarding', locale.value)
    }
    return null
  })

  const ensureCompletedProfile = async () => {
    const user = authStore.user
    if (!user || user.role === 'admin') return true

    if (userStore.profile?.userId !== user.id) {
      await userStore.loadCurrentProfile(user.id)
    }

    if (
      userStore.profile
      && 'onboardingCompleted' in userStore.profile
      && userStore.profile.onboardingCompleted
    ) {
      return true
    }

    if (onboardingPath.value) {
      await navigateTo({
        path: onboardingPath.value,
        query: { reason: 'profile_required' },
      })
    }
    return false
  }

  return {
    onboardingPath,
    ensureCompletedProfile,
  }
}

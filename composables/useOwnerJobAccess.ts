import { useAuthStore } from '~/stores/auth'
import { useSubscriptionStore } from '~/stores/subscription'
import { getAppRoute } from '~/utils/routes'

export const useOwnerJobAccess = () => {
  const { locale } = useI18n()
  const authStore = useAuthStore()
  const subscriptionStore = useSubscriptionStore()

  const openNewJob = async () => {
    const user = authStore.user
    if (!user || user.role !== 'owner' || subscriptionStore.isLoading) return

    await subscriptionStore.loadForUser(user.id, user.role)
    if (subscriptionStore.capabilities.publish_jobs) {
      await navigateTo(getAppRoute('ownerNewJob', locale.value))
      return
    }

    await navigateTo({
      path: getAppRoute('ownerBilling', locale.value),
      query: { reason: 'publish_jobs' },
    })
  }

  return {
    isCheckingAccess: computed(() =>
      authStore.status === 'idle'
      || authStore.status === 'loading'
      || subscriptionStore.isLoading,
    ),
    openNewJob,
  }
}

import { NoopAnalyticsProvider } from '~/services/analytics/NoopAnalyticsProvider'

export default defineNuxtPlugin((nuxtApp) => {
  const analytics = new NoopAnalyticsProvider()
  const router = useRouter()

  nuxtApp.hook('page:finish', () => {
    analytics.page(
      router.currentRoute.value.fullPath,
      document.title,
    )
  })

  return {
    provide: {
      analytics,
    },
  }
})

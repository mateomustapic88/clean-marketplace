<template>
  <CleanerDashboard>
    <header class="cleaner-home__welcome"><div><DemoBadge v-if="profile?.isDemo" type="profile" /><h1>{{ t('cleaner.dashboard.welcome', { name: profile?.firstName ?? authStore.user?.displayName ?? '' }) }}</h1><p>{{ t('cleaner.dashboard.description') }}</p></div><BaseButton :to="getAppRoute('cleanerJobs', locale)">{{ t('cleaner.dashboard.browse') }}</BaseButton></header>
    <ProgressCard :title="t('cleaner.dashboard.profileCompletion')" :description="t('cleaner.dashboard.profileHint')" :value="completion" :to="getAppRoute('cleanerProfile', locale)" :action="t('cleaner.dashboard.completeProfile')" />
    <BaseAlert variant="info" :title="t('cleaner.dashboard.subscription')">{{ t('cleaner.dashboard.subscriptionPlaceholder') }}</BaseAlert>
    <section><h2>{{ t('cleaner.dashboard.statistics') }}</h2><div class="cleaner-home__stats"><CleanerStatsCard :icon="FileText" :value="pendingOffers.length" :label="t('cleaner.dashboard.activeOffers')" /><CleanerStatsCard :icon="CircleCheck" :value="acceptedJobs.length" :label="t('cleaner.dashboard.acceptedJobs')" /><CleanerStatsCard :icon="Wallet" value="-" :label="t('cleaner.dashboard.earnings')" /><CleanerStatsCard :icon="Star" :value="profile?.averageRating ?? '-'" :label="t('cleaner.dashboard.rating')" /></div></section>
    <section><h2>{{ t('cleaner.dashboard.quickActions') }}</h2><div class="cleaner-home__actions"><BaseButton :to="getAppRoute('cleanerProfile', locale)">{{ t('cleaner.dashboard.completeProfile') }}</BaseButton><BaseButton variant="secondary" :to="getAppRoute('cleanerJobs', locale)">{{ t('cleaner.dashboard.browse') }}</BaseButton><BaseButton variant="secondary" :to="getAppRoute('cleanerOffers', locale)">{{ t('cleaner.dashboard.myOffers') }}</BaseButton><BaseButton variant="ghost" :to="getAppRoute('cleanerAvailability', locale)">{{ t('cleaner.navigation.availability') }}</BaseButton></div></section>
    <section><h2>{{ t('cleaner.dashboard.recommended') }}</h2><div class="cleaner-home__grid"><JobSummaryCard v-for="job in recommended.slice(0, 4)" :key="job.id" :job="job" :city="cityName(job.cityCode)" :to="getCleanerJobRoute(job.id, locale)" /></div></section>
    <section><h2>{{ t('cleaner.dashboard.upcoming') }}</h2><div class="cleaner-home__grid"><AcceptedJobCard v-for="job in acceptedJobs.slice(0, 3)" :key="job.id" :job="job" :city="cityName(job.cityCode)" :to="getCleanerJobRoute(job.id, locale)" /></div></section>
  </CleanerDashboard>
</template>

<script setup lang="ts">
import { CircleCheck, FileText, Star, Wallet } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useOffersStore } from '~/stores/offers'
import { useUserStore } from '~/stores/user'
import { getCleanerProfileCompletion, normalizeCleanerProfile } from '~/utils/cleaner'
import { getAppRoute, getCleanerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner', en: '/dashboard-cleaner', sl: '/nadzorna-plosca-cistilec' } })
const { t, locale } = useI18n()
const authStore = useAuthStore(), jobsStore = useJobsStore(), offersStore = useOffersStore(), userStore = useUserStore()
const load = async (id?: string) => {
  if (!id) return
  await Promise.all([jobsStore.loadJobs(), offersStore.loadForCleaner(id), userStore.loadCurrentProfile(id), userStore.loadDirectory()])
}
watch(() => authStore.user?.id, load, { immediate: true })
const profile = computed(() => userStore.profile && 'completedJobs' in userStore.profile ? normalizeCleanerProfile(userStore.profile) : null)
const completion = computed(() => profile.value ? getCleanerProfileCompletion(profile.value) : 0)
const pendingOffers = computed(() => offersStore.offers.filter((offer) => offer.status === 'pending'))
const acceptedJobs = computed(() => jobsStore.jobs.filter((job) => job.assignedCleanerId === authStore.user?.id && ['assigned', 'cleaner_confirmed', 'in_progress', 'completed'].includes(job.status)))
const offeredIds = computed(() => new Set(offersStore.offers.map((offer) => offer.jobId)))
const recommended = computed(() => jobsStore.jobs.filter((job) => ['published', 'receiving_offers'].includes(job.status) && !offeredIds.value.has(job.id) && (!profile.value?.serviceAreas.length || profile.value.serviceAreas.some((area) => area.cityCode === job.cityCode))))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
useSeoMeta({ title: () => t('cleaner.dashboard.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.cleaner-home { &__welcome { display: flex; flex-wrap: wrap; gap: $space-5; align-items: center; justify-content: space-between; h1 { margin-block: $space-3; font-size: $font-size-3xl; } p { color: $color-text-secondary; } } &__stats, &__grid { display: grid; gap: $space-4; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); } &__actions { display: flex; flex-wrap: wrap; gap: $space-3; } } section { display: grid; gap: $space-5; }
</style>

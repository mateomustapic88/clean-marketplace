<template>
  <div class="cleaner-jobs-page">
    <header><h1>{{ t('cleaner.jobs.title') }}</h1><p>{{ t('cleaner.jobs.description') }}</p></header>
    <BaseCard class="cleaner-jobs-page__filters">
      <BaseSelect v-model="distance" :label="t('cleaner.jobs.filters.distance')" :options="distanceOptions" />
      <BaseInput v-model.number="minimumBudget" type="number" :label="t('cleaner.jobs.filters.budget')" />
      <BaseInput v-model="date" type="date" :label="t('cleaner.jobs.filters.date')" />
      <BaseSelect v-model="service" :label="t('cleaner.jobs.filters.service')" :placeholder="t('catalog.allOptions')" :options="serviceOptions" />
      <BaseInput v-model.number="maximumSize" type="number" :label="t('cleaner.jobs.filters.size')" />
      <BaseCheckbox v-model="sameDay" :label="t('cleaner.jobs.filters.sameDay')" />
      <BaseCheckbox v-model="weekend" :label="t('cleaner.jobs.filters.weekend')" />
      <BaseCheckbox v-model="notApplied" :label="t('cleaner.jobs.filters.notApplied')" />
    </BaseCard>
    <BaseEmptyState v-if="!filtered.length" :title="t('cleaner.jobs.empty')" :description="t('cleaner.jobs.emptyDescription')" />
    <div class="cleaner-jobs-page__grid">
      <JobSummaryCard v-for="job in filtered" :key="job.id" :job="job" :city="cityName(job.cityCode)" :to="getCleanerJobRoute(job.id, locale)">
        <template #actions><FavouriteButton :active="favourites.includes(job.id)" @toggle="toggleFavourite(job.id)" /></template>
      </JobSummaryCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CleanerProfile } from '~/domains/users/types'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useOffersStore } from '~/stores/offers'
import { useUserStore } from '~/stores/user'
import { normalizeCleanerProfile } from '~/utils/cleaner'
import { getCleanerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/poslovi', en: '/dashboard-cleaner/jobs', sl: '/nadzorna-plosca-cistilec/dela' } })
const { t, locale } = useI18n(), authStore = useAuthStore(), jobsStore = useJobsStore(), offersStore = useOffersStore(), userStore = useUserStore()
const distance = ref('all'), minimumBudget = ref(0), date = ref(''), service = ref(''), maximumSize = ref(0), sameDay = ref(false), weekend = ref(false), notApplied = ref(false)
const load = async (id?: string) => {
  if (!id) return
  await Promise.all([jobsStore.loadJobs(), offersStore.loadForCleaner(id), userStore.loadCurrentProfile(id), userStore.loadDirectory()])
}
watch(() => authStore.user?.id, load, { immediate: true })
const profile = computed(() => userStore.profile && 'completedJobs' in userStore.profile ? normalizeCleanerProfile(userStore.profile as CleanerProfile) : null)
const favourites = computed(() => profile.value?.favouriteJobIds ?? [])
const appliedIds = computed(() => new Set(offersStore.offers.map((offer) => offer.jobId)))
const serviceKeys = ['cleaningSuppliesProvided', 'linenReplacement', 'towelReplacement', 'laundry', 'balconyCleaning', 'kitchenCleaning', 'fridgeCleaning', 'ovenCleaning', 'windowCleaning', 'sameDayTurnover'] as const
const serviceOptions = computed(() => serviceKeys.map((value) => ({ value, label: t(`owner.job.services.${value}`) })))
const distanceOptions = computed(() => ['all', '10', '25', '50'].map((value) => ({ value, label: value === 'all' ? t('catalog.allOptions') : t('cleaner.jobs.filters.kilometres', { value }) })))
const filtered = computed(() => jobsStore.jobs.filter((job) => {
  if (!['published', 'receiving_offers'].includes(job.status)) return false
  if (minimumBudget.value && job.proposedBudget < minimumBudget.value) return false
  if (date.value && job.preferredDate !== date.value) return false
  if (service.value && !job.services[service.value as keyof typeof job.services]) return false
  if (maximumSize.value && job.sizeSquareMeters > maximumSize.value) return false
  if (sameDay.value && !job.services.sameDayTurnover) return false
  if (weekend.value && ![0, 6].includes(new Date(`${job.preferredDate}T12:00:00`).getDay())) return false
  if (notApplied.value && appliedIds.value.has(job.id)) return false
  if (distance.value !== 'all' && profile.value?.serviceAreas.length && !profile.value.serviceAreas.some((area) => area.cityCode === job.cityCode && area.radiusKm <= Number(distance.value))) return false
  return true
}))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const toggleFavourite = async (jobId: string) => {
  if (!userStore.profile && authStore.user) {
    await userStore.loadCurrentProfile(authStore.user.id)
  }
  await userStore.toggleFavouriteJob(jobId)
}
useSeoMeta({ title: () => t('cleaner.jobs.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.cleaner-jobs-page { display: grid; gap: $space-6; > header h1 { font-size: $font-size-3xl; } > header p { color: $color-text-secondary; } &__filters, &__grid { display: grid; gap: $space-4; } @media (min-width: $breakpoint-md) { &__filters { grid-template-columns: repeat(3, minmax(0, 1fr)); } &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } }
</style>

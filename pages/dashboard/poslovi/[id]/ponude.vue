<template>
  <div v-if="job" class="owner-offers-page">
    <Breadcrumbs :items="breadcrumbs" />
    <header><div><h1>{{ t('owner.offers.title') }}</h1><p>{{ job.title }}</p></div><StatusBadge :status="job.status" /></header>
    <BaseAlert v-if="acceptedOffer" variant="success">{{ t('owner.offers.selected') }}</BaseAlert>
    <BaseEmptyState v-if="!offersStore.offers.length" :title="t('owner.offers.empty')" :description="t('owner.offers.emptyDescription')" />
    <div class="owner-offers-page__grid">
      <template v-for="offer in offersStore.offers" :key="offer.id">
        <OfferComparisonCard v-if="cleanerFor(offer.cleanerId)" :offer="offer" :cleaner="cleanerFor(offer.cleanerId)!" :user="userFor(offer.cleanerId)" :show-contact="offer.status === 'accepted'" @accept="accept(offer.id)" @reject="reject(offer.id)" />
      </template>
    </div>
  </div>
  <BaseEmptyState v-else :title="t('jobDetail.notFound')" :description="t('jobDetail.notFoundDescription')" />
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useOffersStore } from '~/stores/offers'
import { useUserStore } from '~/stores/user'
import { getAppRoute, getOwnerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/poslovi/[id]/ponude', en: '/dashboard/jobs/[id]/offers' } })
const route = useRoute(), { t, locale } = useI18n()
const authStore = useAuthStore(), jobsStore = useJobsStore(), offersStore = useOffersStore(), userStore = useUserStore()
const jobId = String(route.params.id)
const load = async (ownerId?: string) => {
  if (!ownerId) return
  await Promise.all([jobsStore.loadJob(jobId), offersStore.loadForJob(jobId), userStore.loadDirectory()])
}
watch(() => authStore.user?.id, load, { immediate: true })
const job = computed(() => jobsStore.selectedJob?.ownerId === authStore.user?.id ? jobsStore.selectedJob : null)
const acceptedOffer = computed(() => offersStore.offers.find((offer) => offer.status === 'accepted'))
const cleanerFor = (userId: string) => userStore.cleaners.find((cleaner) => cleaner.userId === userId)
const userFor = (userId: string) => userStore.users.find((user) => user.id === userId)
const accept = async (offerId: string) => {
  if (!authStore.user) return
  await offersStore.acceptOffer(offerId, authStore.user.id)
  await jobsStore.loadJob(jobId)
}
const reject = async (offerId: string) => {
  if (authStore.user) await offersStore.rejectOffer(offerId, authStore.user.id)
}
const breadcrumbs = computed(() => [{ label: t('owner.navigation.dashboard'), to: getAppRoute('ownerDashboard', locale.value) }, { label: t('owner.jobs.title'), to: getAppRoute('ownerJobs', locale.value) }, { label: job.value?.title ?? '', to: getOwnerJobRoute(jobId, locale.value) }, { label: t('owner.offers.title') }])
useSeoMeta({ title: () => t('owner.offers.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.owner-offers-page { display: grid; gap: $space-6; > header { display: flex; flex-wrap: wrap; gap: $space-4; justify-content: space-between; h1 { font-size: $font-size-3xl; } p { color: $color-text-secondary; } } &__grid { display: grid; gap: $space-5; } @media (min-width: $breakpoint-lg) { &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } }
</style>

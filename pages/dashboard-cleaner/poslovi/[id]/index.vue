<template>
  <div v-if="job" class="cleaner-job-detail">
    <Breadcrumbs :items="breadcrumbs" />
    <header><div><div class="cleaner-job-detail__title"><h1>{{ displayTitle }}</h1><DemoBadge v-if="job.isDemo" type="listing" /></div><p>{{ cityName(job.cityCode) }} · {{ job.approximateArea }}</p></div><StatusBadge :status="job.status" /></header>
    <div class="cleaner-job-detail__actions">
      <FavouriteButton :active="favourites.includes(job.id)" @toggle="toggleFavourite(job.id)" />
      <BaseButton v-if="!existingOffer && canApply" @click="apply">{{ t('cleaner.offer.submit') }}</BaseButton>
      <BaseButton v-if="existingOffer?.status === 'pending'" :to="getCleanerOfferRoute(job.id, locale)">{{ t('cleaner.offer.edit') }}</BaseButton>
      <OfferStatusBadge v-if="existingOffer" :status="existingOffer.status" />
      <BaseButton v-if="job.status === 'assigned' && isAssigned" @click="progress('cleaner_confirmed')">{{ t('cleaner.progress.confirm') }}</BaseButton>
      <BaseButton v-if="job.status === 'cleaner_confirmed' && isAssigned" @click="progress('in_progress')">{{ t('cleaner.progress.start') }}</BaseButton>
      <BaseButton v-if="job.status === 'in_progress' && isAssigned" @click="progress('completed')">{{ t('cleaner.progress.complete') }}</BaseButton>
      <BaseButton v-if="job.status === 'completed' && isAssigned" :to="getJobReviewRoute('cleaner', job.id, locale)">{{ t('reviews.action') }}</BaseButton>
    </div>
    <BaseAlert v-if="demoOfferBlocked" variant="info">{{ t('cleaner.offer.demoUnavailable') }}</BaseAlert>
    <div class="cleaner-job-detail__layout">
      <main>
        <BaseCard><h2>{{ t('owner.job.overview') }}</h2><dl><div><dt>{{ t('jobDetail.date') }}</dt><dd>{{ formatPublicDate(job.preferredDate, locale) }} {{ job.preferredStartTime }}</dd></div><div><dt>{{ t('jobDetail.budget') }}</dt><dd>{{ formatPrice(job.proposedBudget, locale) }}</dd></div><div><dt>{{ t('jobDetail.size') }}</dt><dd>{{ job.sizeSquareMeters }} m²</dd></div><div><dt>{{ t('owner.job.fields.address') }}</dt><dd>{{ isAssigned ? job.address : job.approximateArea }}</dd></div></dl></BaseCard>
        <BaseCard><h2>{{ t('jobDetail.services') }}</h2><ul><li v-for="service in activeServices" :key="service">{{ t(`owner.job.services.${service}`) }}</li></ul></BaseCard>
        <BaseCard v-if="isAssigned && canViewContact && ownerUser && ownerProfile"><h2>{{ t('marketplace.contact.owner') }}</h2><a :href="`mailto:${ownerUser.email}`">{{ ownerUser.email }}</a><a :href="`tel:${ownerProfile.phone}`">{{ ownerProfile.phone }}</a></BaseCard>
        <BaseAlert v-else-if="isAssigned && !canViewContact" variant="warning">
          {{ t('billing.contactRestricted') }}
          <NuxtLink :to="getAppRoute('cleanerBilling', locale)">{{ t('billing.manage') }}</NuxtLink>
        </BaseAlert>
      </main>
      <aside><BaseCard><h2>{{ t('owner.job.activity') }}</h2><JobTimeline :activities="timeline" /></BaseCard></aside>
    </div>
  </div>
  <BaseEmptyState v-else :title="t('jobDetail.notFound')" :description="t('jobDetail.notFoundDescription')" />
</template>

<script setup lang="ts">
import type { CleanerProfile } from '~/domains/users/types'
import { buildJobTimeline } from '~/services/jobs/jobLifecycle'
import { canJobReceiveOffers } from '~/services/offers/offerRules'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useOffersStore } from '~/stores/offers'
import { useSubscriptionStore } from '~/stores/subscription'
import { useUserStore } from '~/stores/user'
import { formatPrice, formatPublicDate } from '~/utils/formatters'
import { demoDisplayText } from '~/utils/demoPresentation'
import { normalizeCleanerProfile } from '~/utils/cleaner'
import { getAppRoute, getCleanerOfferRoute, getJobReviewRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard-cleaner', middleware: ['auth', 'role'], roles: ['cleaner'] })
defineI18nRoute({ paths: { hr: '/dashboard-cleaner/poslovi/[id]', en: '/dashboard-cleaner/jobs/[id]' } })
const route = useRoute(), { t, locale } = useI18n()
const authStore = useAuthStore(), jobsStore = useJobsStore(), offersStore = useOffersStore(), userStore = useUserStore()
const subscriptionStore = useSubscriptionStore()
const jobId = String(route.params.id)
const load = async (id?: string) => {
  if (!id) return
  await Promise.all([jobsStore.loadJob(jobId), jobsStore.loadActivities(jobId), offersStore.loadForCleaner(id), userStore.loadCurrentProfile(id), userStore.loadDirectory(), subscriptionStore.loadForUser(id, 'cleaner')])
}
watch(() => authStore.user?.id, load, { immediate: true })
const job = computed(() => jobsStore.selectedJob)
const displayTitle = computed(() => job.value ? demoDisplayText(job.value.title, job.value.isDemo) : '')
const demoOfferBlocked = ref(false)
const profile = computed(() => userStore.profile && 'completedJobs' in userStore.profile ? normalizeCleanerProfile(userStore.profile as CleanerProfile) : null)
const existingOffer = computed(() => offersStore.offers.find((offer) => offer.jobId === jobId))
const canApply = computed(() => job.value ? canJobReceiveOffers(job.value) && job.value.ownerId !== authStore.user?.id : false)
const isAssigned = computed(() => job.value?.assignedCleanerId === authStore.user?.id)
const canViewContact = computed(() => subscriptionStore.capabilities.view_contact)
const favourites = computed(() => profile.value?.favouriteJobIds ?? [])
const ownerUser = computed(() => userStore.users.find((user) => user.id === job.value?.ownerId))
const ownerProfile = computed(() => userStore.owners.find((owner) => owner.userId === job.value?.ownerId))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const activeServices = computed(() => job.value ? Object.entries(job.value.services).filter(([, active]) => active).map(([key]) => key) : [])
const timeline = computed(() => jobsStore.activities.length ? jobsStore.activities : job.value ? buildJobTimeline(job.value) : [])
const breadcrumbs = computed(() => [{ label: t('cleaner.navigation.jobs'), to: getAppRoute('cleanerJobs', locale.value) }, { label: displayTitle.value }])
const apply = async () => {
  if (!job.value) return
  if (job.value.isDemo) {
    demoOfferBlocked.value = true
    return
  }
  await navigateTo(getCleanerOfferRoute(job.value.id, locale.value))
}
const toggleFavourite = async (id: string) => {
  if (!userStore.profile && authStore.user) {
    await userStore.loadCurrentProfile(authStore.user.id)
  }
  await userStore.toggleFavouriteJob(id)
}
const progress = async (status: 'cleaner_confirmed' | 'in_progress' | 'completed') => {
  if (authStore.user) await jobsStore.progressJob(jobId, authStore.user.id, status)
}
useSeoMeta({ title: () => displayTitle.value || t('jobDetail.notFound'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.cleaner-job-detail { display: grid; gap: $space-6; > header { display: flex; flex-wrap: wrap; gap: $space-4; justify-content: space-between; h1 { font-size: $font-size-3xl; } p { color: $color-text-secondary; } } &__title { display: flex; flex-wrap: wrap; gap: $space-3; align-items: center; margin-block: $space-3; } &__actions { display: flex; flex-wrap: wrap; gap: $space-3; align-items: center; } &__layout, main { display: grid; gap: $space-5; } :deep(.base-card) { display: grid; gap: $space-4; } dl { display: grid; gap: $space-3; } dl div { display: flex; justify-content: space-between; gap: $space-4; } ul { display: grid; gap: $space-2; padding-left: $space-5; } @media (min-width: $breakpoint-xl) { &__layout { grid-template-columns: 1.4fr .8fr; } } }
</style>

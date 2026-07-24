<template>
  <div v-if="job" class="owner-job-detail">
    <Breadcrumbs :items="breadcrumbs" />
    <header><div><DemoBadge v-if="job.isDemo" type="listing" /><h1>{{ job.title }}</h1><p>{{ job.apartmentName }} · {{ cityName(job.cityCode) }}</p></div><StatusBadge :status="job.status" /></header>
    <div class="owner-job-detail__actions">
      <BaseButton v-if="job.offerCount" :to="getOwnerJobOffersRoute(job.id, locale)">{{ t('owner.offers.view', { count: job.offerCount }) }}</BaseButton>
      <BaseButton v-if="!isPublishedJobReadOnly(job.status)" :to="getOwnerJobEditRoute(job.id, locale)">{{ t('owner.jobs.edit') }}</BaseButton>
      <BaseButton variant="secondary" @click="duplicate">{{ t('owner.jobs.duplicate') }}</BaseButton>
      <BaseButton v-if="['published', 'receiving_offers', 'completed', 'cancelled'].includes(job.status)" variant="ghost" @click="transition('archived')">{{ t('owner.jobs.archive') }}</BaseButton>
      <BaseButton v-if="['published', 'receiving_offers', 'assigned', 'in_progress'].includes(job.status)" variant="ghost" @click="transition('cancelled')">{{ t('owner.jobs.cancel') }}</BaseButton>
      <BaseButton v-if="['archived', 'cancelled'].includes(job.status)" @click="transition('published')">{{ t('owner.jobs.republish') }}</BaseButton>
      <BaseButton v-if="job.status === 'completed'" :to="getJobReviewRoute('owner', job.id, locale)">{{ t('reviews.action') }}</BaseButton>
    </div>
    <div class="owner-job-detail__layout">
      <main>
        <BaseCard>
          <h2>{{ t('owner.job.overview') }}</h2><dl>
            <div><dt>{{ t('jobDetail.date') }}</dt><dd>{{ formatPublicDate(job.preferredDate, locale) }} {{ job.preferredStartTime }}</dd></div>
            <div><dt>{{ t('jobDetail.budget') }}</dt><dd>{{ formatPrice(job.proposedBudget, locale) }}</dd></div>
            <div><dt>{{ t('jobDetail.size') }}</dt><dd>{{ job.sizeSquareMeters }} m²</dd></div>
            <div><dt>{{ t('owner.job.fields.guests') }}</dt><dd>{{ job.guestCapacity ?? job.beds * 2 }}</dd></div>
            <div><dt>{{ t('owner.job.fields.address') }}</dt><dd>{{ job.address }}</dd></div>
            <div><dt>{{ t('jobDetail.offerCount', { count: job.offerCount }) }}</dt><dd>{{ job.offerCount }}</dd></div>
          </dl>
        </BaseCard>
        <BaseCard><h2>{{ t('jobDetail.services') }}</h2><ul><li v-for="service in activeServices" :key="service"><Check :size="17" />{{ t(`owner.job.services.${service}`) }}</li></ul></BaseCard>
        <BaseCard><h2>{{ t('jobDetail.instructions') }}</h2><p>{{ job.additionalInstructions || t('owner.job.noNotes') }}</p></BaseCard>
      </main>
      <aside><BaseCard><h2>{{ t('owner.job.activity') }}</h2><JobTimeline :activities="timeline" /></BaseCard></aside>
    </div>
  </div>
  <BaseEmptyState v-else :title="t('jobDetail.notFound')" :description="t('jobDetail.notFoundDescription')" />
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'
import type { CleaningJobStatus } from '~/domains/jobs/types'
import { buildJobTimeline, isPublishedJobReadOnly } from '~/services/jobs/jobLifecycle'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { formatPrice, formatPublicDate } from '~/utils/formatters'
import { getAppRoute, getJobReviewRoute, getOwnerJobEditRoute, getOwnerJobOffersRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/poslovi/[id]', en: '/dashboard/jobs/[id]' } })
const route = useRoute()
const { t, locale } = useI18n()
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const userStore = useUserStore()
await Promise.all([jobsStore.loadJob(String(route.params.id)), userStore.loadDirectory()])
const job = computed(() => jobsStore.selectedJob?.ownerId === authStore.user?.id ? jobsStore.selectedJob : null)
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const activeServices = computed(() => job.value ? Object.entries(job.value.services).filter(([, active]) => active).map(([key]) => key) : [])
const timeline = computed(() => job.value ? buildJobTimeline(job.value) : [])
const breadcrumbs = computed(() => [{ label: t('owner.navigation.dashboard'), to: getAppRoute('ownerDashboard', locale.value) }, { label: t('owner.jobs.title'), to: getAppRoute('ownerJobs', locale.value) }, { label: job.value?.title ?? '' }])
const transition = async (status: CleaningJobStatus) => {
  if (job.value) await jobsStore.transitionJob(job.value.id, status)
}
const duplicate = async () => {
  if (!job.value || !authStore.user) return
  const copy = await jobsStore.duplicateJob(job.value.id, authStore.user.id)
  await navigateTo(getOwnerJobEditRoute(copy.id, locale.value))
}
useSeoMeta({ title: () => job.value?.title ?? t('jobDetail.notFound'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.owner-job-detail { display: grid; gap: $space-6;
  > header { display: flex; flex-wrap: wrap; gap: $space-4; align-items: flex-start; justify-content: space-between; h1 { margin-block: $space-3; font-size: $font-size-3xl; } p { color: $color-text-secondary; } :deep(.base-badge) { flex: 0 0 auto; align-self: flex-start; white-space: nowrap; } }
  &__actions { display: flex; flex-wrap: wrap; gap: $space-3; }
  &__layout { display: grid; gap: $space-5; } main { display: grid; gap: $space-5; } :deep(.base-card) { display: grid; gap: $space-4; }
  dl { display: grid; gap: $space-3; } dl div { display: flex; justify-content: space-between; gap: $space-4; padding-bottom: $space-2; border-bottom: 1px solid $color-border; } dt { color: $color-text-secondary; }
  ul { display: grid; gap: $space-2; padding: 0; list-style: none; } li { display: flex; gap: $space-2; }
  @media (min-width: $breakpoint-xl) { &__layout { grid-template-columns: minmax(0, 1.4fr) minmax(18rem, .8fr); } }
}
</style>

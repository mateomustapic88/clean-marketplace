<template>
  <div class="owner-dashboard">
    <header class="owner-dashboard__welcome">
      <div><DemoBadge v-if="profile?.isDemo" type="profile" /><h1>{{ t('owner.dashboard.welcome', { name: profile?.firstName ?? authStore.user?.displayName ?? '' }) }}</h1><p>{{ t('owner.dashboard.description') }}</p></div>
      <BaseButton :loading="isCheckingAccess" @click="openNewJob"><Plus :size="18" />{{ t('owner.dashboard.publish') }}</BaseButton>
    </header>
    <ProgressCard :title="t('owner.dashboard.profileTitle')" :description="t('owner.dashboard.profileDescription')" :value="completion" :to="getAppRoute('ownerProfile', locale)" :action="t('owner.dashboard.editProfile')" />
    <section>
      <h2>{{ t('owner.dashboard.statistics') }}</h2>
      <div class="owner-dashboard__stats">
        <OwnerStatsCard :icon="BriefcaseBusiness" :label="t('owner.stats.active')" :value="statistics.active" />
        <OwnerStatsCard :icon="FilePenLine" :label="t('owner.stats.drafts')" :value="statistics.drafts" />
        <OwnerStatsCard :icon="CircleCheck" :label="t('owner.stats.completed')" :value="statistics.completed" />
        <OwnerStatsCard :icon="MessagesSquare" :label="t('owner.stats.offers')" :value="statistics.offers" />
        <OwnerStatsCard :icon="Star" :label="t('owner.stats.rating')" :value="profile?.averageRating ?? '-'" />
        <OwnerStatsCard :icon="Timer" :label="t('owner.stats.completion')" :value="statistics.averageCompletionHours ? `${statistics.averageCompletionHours} h` : '-'" />
      </div>
    </section>
    <section>
      <h2>{{ t('owner.dashboard.quickActions') }}</h2>
      <div class="owner-dashboard__quick">
        <BaseButton :loading="isCheckingAccess" @click="openNewJob">{{ t('owner.dashboard.publish') }}</BaseButton>
        <BaseButton v-if="draft" variant="secondary" :to="getOwnerJobEditRoute(draft.id, locale)">{{ t('owner.dashboard.continueDraft') }}</BaseButton>
        <BaseButton v-if="previous" variant="secondary" @click="duplicate(previous.id)">{{ t('owner.dashboard.duplicate') }}</BaseButton>
        <BaseButton variant="ghost" :to="getAppRoute('ownerProfile', locale)">{{ t('owner.dashboard.editProfile') }}</BaseButton>
      </div>
    </section>
    <section class="owner-dashboard__columns">
      <BaseCard>
        <h2>{{ t('owner.dashboard.activeJobs') }}</h2>
        <JobSummaryCard v-for="job in activeJobs.slice(0, 3)" :key="job.id" :job="job" :city="cityName(job.cityCode)" :to="getOwnerJobRoute(job.id, locale)" />
        <BaseEmptyState v-if="!activeJobs.length" :title="t('owner.dashboard.noActive')" :description="t('owner.jobs.emptyDescription')" />
      </BaseCard>
      <BaseCard>
        <h2>{{ t('owner.dashboard.upcoming') }}</h2>
        <ul><li v-for="job in upcoming" :key="job.id"><time :datetime="job.preferredDate">{{ formatPublicDate(job.preferredDate, locale) }}</time><NuxtLink :to="getOwnerJobRoute(job.id, locale)">{{ job.title }}</NuxtLink></li></ul>
      </BaseCard>
    </section>
    <section>
      <h2>{{ t('owner.dashboard.recent') }}</h2>
      <div class="owner-dashboard__cards"><JobSummaryCard v-for="job in jobs.slice(0, 3)" :key="job.id" :job="job" :city="cityName(job.cityCode)" :to="getOwnerJobRoute(job.id, locale)" /></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { BriefcaseBusiness, CircleCheck, FilePenLine, MessagesSquare, Plus, Star, Timer } from '@lucide/vue'
import type { OwnerProfile } from '~/domains/users/types'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { formatPublicDate } from '~/utils/formatters'
import { getProfileCompletion, getOwnerJobStatistics } from '~/services/jobs/jobLifecycle'
import { getAppRoute, getOwnerJobEditRoute, getOwnerJobRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard', en: '/dashboard', sl: '/nadzorna-plosca' } })
const { t, locale } = useI18n()
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const userStore = useUserStore()
const { isCheckingAccess, openNewJob } = useOwnerJobAccess()
const loadOwnerDashboard = async (userId?: string) => {
  if (!userId) return
  await Promise.all([
    jobsStore.loadJobs({ ownerId: userId }),
    userStore.loadCurrentProfile(userId),
    userStore.loadDirectory(),
  ])
}
watch(() => authStore.user?.id, loadOwnerDashboard, { immediate: true })
const profile = computed(() => userStore.profile as OwnerProfile | null)
const jobs = computed(() => jobsStore.jobs)
const statistics = computed(() => getOwnerJobStatistics(jobs.value))
const completion = computed(() => profile.value ? getProfileCompletion(profile.value) : 0)
const activeJobs = computed(() => jobs.value.filter((job) => ['published', 'receiving_offers', 'assigned', 'in_progress'].includes(job.status)))
const draft = computed(() => jobs.value.find((job) => job.status === 'draft'))
const previous = computed(() => jobs.value.find((job) => job.status === 'completed') ?? jobs.value.at(0))
const upcoming = computed(() => [...activeJobs.value].sort((a, b) => a.preferredDate.localeCompare(b.preferredDate)).slice(0, 5))
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const duplicate = async (id: string) => {
  if (!authStore.user) return
  const job = await jobsStore.duplicateJob(id, authStore.user.id)
  await navigateTo(getOwnerJobEditRoute(job.id, locale.value))
}
useSeoMeta({ title: () => t('owner.dashboard.metaTitle'), robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
.owner-dashboard { display: grid; gap: $space-8;
  &__welcome { display: flex; flex-wrap: wrap; gap: $space-5; align-items: center; justify-content: space-between; h1 { margin-block: $space-3; font-size: 1.75rem; line-height: $line-height-tight; } p { color: $color-text-secondary; } }
  section { display: grid; gap: $space-5; } section > h2 { font-size: $font-size-xl; }
  &__stats, &__cards { display: grid; gap: $space-4; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); }
  &__quick { display: flex; flex-wrap: wrap; gap: $space-3; }
  &__columns { display: grid; gap: $space-5; } &__columns :deep(.base-card) { display: grid; gap: $space-4; }
  ul { display: grid; gap: $space-3; padding: 0; list-style: none; } li { display: grid; gap: $space-1; } time { color: $color-text-secondary; }
  @media (min-width: $breakpoint-md) { gap: $space-10; &__welcome h1 { font-size: $font-size-3xl; } }
  @media (min-width: $breakpoint-xl) { &__columns { grid-template-columns: 1.5fr 1fr; } }
}
</style>

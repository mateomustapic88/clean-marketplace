<template>
  <div v-if="job" class="detail-page">
    <div class="container">
      <Breadcrumbs :items="breadcrumbs" />
      <div class="detail-page__layout">
        <main>
          <header class="detail-page__header">
            <div class="detail-page__badges">
              <BaseBadge v-if="job.isUrgent" variant="error">{{ t('jobs.card.urgent') }}</BaseBadge>
            </div>
            <div class="detail-page__title">
              <h1>{{ displayTitle }}</h1>
              <DemoBadge v-if="job.isDemo" type="listing" />
            </div>
            <p><MapPin :size="18" />{{ cityName(job.cityCode) }} - {{ job.approximateArea }}</p>
          </header>
          <section class="detail-page__facts" :aria-label="t('jobDetail.keyFacts')">
            <div><CalendarDays /><span>{{ t('jobDetail.date') }}</span><strong>{{ formatPublicDate(job.preferredDate, locale) }}</strong></div>
            <div><Clock3 /><span>{{ t('jobDetail.time') }}</span><strong>{{ job.preferredStartTime }}</strong></div>
            <div><WalletCards /><span>{{ t('jobDetail.budget') }}</span><PriceDisplay :value="job.proposedBudget" :suffix="t(`jobs.budgetType.${job.budgetType}`)" /></div>
            <div><Timer /><span>{{ t('jobDetail.duration') }}</span><strong>{{ t('jobs.card.duration', { value: job.estimatedDurationHours }) }}</strong></div>
          </section>
          <BaseCard class="detail-page__section">
            <h2>{{ t('jobDetail.apartment') }}</h2>
            <dl>
              <div><dt>{{ t('jobDetail.size') }}</dt><dd>{{ job.sizeSquareMeters }} m²</dd></div>
              <div><dt>{{ t('jobDetail.bedrooms') }}</dt><dd>{{ job.bedrooms }}</dd></div>
              <div><dt>{{ t('jobDetail.bathrooms') }}</dt><dd>{{ job.bathrooms }}</dd></div>
              <div><dt>{{ t('jobDetail.beds') }}</dt><dd>{{ job.beds }}</dd></div>
            </dl>
          </BaseCard>
          <BaseCard class="detail-page__section">
            <h2>{{ t('jobDetail.services') }}</h2>
            <ul class="detail-page__services">
              <li v-for="service in enabledServices" :key="service"><Check :size="18" />{{ t(`jobDetail.serviceNames.${service}`) }}</li>
            </ul>
          </BaseCard>
          <BaseCard class="detail-page__section">
            <h2>{{ t('jobDetail.instructions') }}</h2>
            <p>{{ job.additionalInstructions }}</p>
          </BaseCard>
          <BaseCard v-if="owner" class="detail-page__section">
            <h2>{{ t('jobDetail.owner') }}</h2>
            <div class="detail-page__owner">
              <BaseAvatar :name="ownerName" />
              <div>
                <strong>{{ ownerName }}</strong>
                <RatingSummary :value="owner.averageRating" :count="owner.ratingCount" />
              </div>
              <DemoBadge v-if="owner.isDemo" type="profile" />
            </div>
          </BaseCard>
        </main>
        <aside class="detail-page__aside">
          <BaseCard>
            <PriceDisplay :value="job.proposedBudget" :suffix="t(`jobs.budgetType.${job.budgetType}`)" />
            <p>{{ t('jobDetail.offerCount', { count: job.offerCount }) }}</p>
            <BaseButton block size="lg" :to="actionRoute">{{ actionLabel }}</BaseButton>
            <small>{{ actionHint }}</small>
          </BaseCard>
        </aside>
      </div>
      <section v-if="relatedJobs.length" class="detail-page__related">
        <SectionHeader align="left" :title="t('jobDetail.related')" />
        <div><JobCard v-for="item in relatedJobs" :key="item.id" :job="item" :city-name="cityName(item.cityCode)" /></div>
      </section>
    </div>
  </div>
  <div v-else class="detail-page__missing container">
    <BaseEmptyState :title="t('jobDetail.notFound')" :description="t('jobDetail.notFoundDescription')">
      <template #action><BaseButton :to="getAppRoute('jobs', locale)">{{ t('jobDetail.back') }}</BaseButton></template>
    </BaseEmptyState>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, Check, Clock3, MapPin, Timer, WalletCards } from '@lucide/vue'
import { useAuthStore } from '~/stores/auth'
import { useJobsStore } from '~/stores/jobs'
import { useUserStore } from '~/stores/user'
import { formatPublicDate } from '~/utils/formatters'
import { demoDisplayName, demoDisplayText } from '~/utils/demoPresentation'
import { getAppRoute, getCleanerJobRoute, getJobRoute } from '~/utils/routes'

defineI18nRoute({ paths: { hr: '/poslovi/[id]', en: '/jobs/[id]' } })
const route = useRoute()
const { t, locale } = useI18n()
const jobsStore = useJobsStore()
const userStore = useUserStore()
const authStore = useAuthStore()
await Promise.all([jobsStore.loadJobs(), userStore.loadDirectory()])
const job = computed(() => jobsStore.jobs.find((item) => item.id === String(route.params.id)) ?? null)
if (!job.value) setResponseStatus(404)
const owner = computed(() => userStore.owners.find((item) => item.userId === job.value?.ownerId))
const displayTitle = computed(() => job.value
  ? demoDisplayText(job.value.title, job.value.isDemo)
  : '')
const ownerName = computed(() => owner.value
  ? demoDisplayName(owner.value.firstName, owner.value.lastName, owner.value.isDemo)
  : '')
const cityName = (code: string) => userStore.cities.find((city) => city.code === code)?.name ?? code
const enabledServices = computed(() => job.value
  ? Object.entries(job.value.services).filter(([, enabled]) => enabled).map(([key]) => key)
  : [])
const relatedJobs = computed(() => jobsStore.jobs
  .filter((item) => item.id !== job.value?.id && item.cityCode === job.value?.cityCode
    && ['published', 'receiving_offers'].includes(item.status))
  .slice(0, 3))
const breadcrumbs = computed(() => [
  { label: t('navigation.home'), to: getAppRoute('home', locale.value) },
  { label: t('jobs.title'), to: getAppRoute('jobs', locale.value) },
  { label: displayTitle.value || t('jobDetail.notFound') },
])
const actionRoute = computed(() => {
  if (!authStore.user) return getAppRoute('login', locale.value)
  if (authStore.user.role !== 'cleaner') return getAppRoute('jobs', locale.value)
  return job.value
    ? getCleanerJobRoute(job.value.id, locale.value)
    : getAppRoute('cleanerJobs', locale.value)
})
const actionLabel = computed(() => !authStore.user
  ? t('jobDetail.loginAction')
  : authStore.user.role !== 'cleaner'
    ? t('jobDetail.cleanerOnly')
    : t('cleaner.jobs.open'))
const actionHint = computed(() => t('jobDetail.actionHint'))
usePublicSeo({
  title: computed(() => displayTitle.value || t('jobDetail.notFound')),
  description: computed(() => job.value
    ? t('jobDetail.metaDescription', { city: cityName(job.value.cityCode), size: job.value.sizeSquareMeters })
    : t('jobDetail.notFoundDescription')),
  path: computed(() => getJobRoute(String(route.params.id), locale.value)),
})
</script>

<style scoped lang="scss">
.detail-page {
  padding-block: $space-8 $space-20;
  background: $color-background;

  &__layout {
    display: grid;
    gap: $space-8;
  }

  &__header {
    margin-bottom: $space-6;

    h1 {
      max-width: 48rem;
      font-size: $font-size-3xl;
    }

    p,
    &__badges {
      display: flex;
      gap: $space-2;
      align-items: center;
      color: $color-text-secondary;
    }
  }

  &__title {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    align-items: center;
    margin-block: $space-4;
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }

  &__facts {
    display: grid;
    gap: $space-3;
    margin-bottom: $space-6;

    > div {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: $space-1 $space-3;
      padding: $space-4;
      background: $color-surface;
      border: 1px solid $color-border;
      border-radius: $radius-lg;
    }

    svg {
      grid-row: span 2;
      color: $color-primary;
    }

    span {
      font-size: $font-size-xs;
      color: $color-text-secondary;
    }
  }

  &__section {
    margin-bottom: $space-5;

    h2 {
      margin-bottom: $space-5;
      font-size: $font-size-xl;
    }

    dl {
      display: grid;
      gap: $space-3;
    }

    dl div {
      display: flex;
      justify-content: space-between;
      padding-bottom: $space-3;
      border-bottom: 1px solid $color-border;
    }

    dt {
      color: $color-text-secondary;
    }
  }

  &__services {
    display: grid;
    gap: $space-3;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      gap: $space-2;
      align-items: center;
    }

    svg {
      color: $color-success;
    }
  }

  &__owner {
    display: flex;
    flex-wrap: wrap;
    gap: $space-4;
    align-items: center;
  }

  &__aside {
    align-self: start;

    .base-card {
      display: grid;
      gap: $space-5;
    }

    p,
    small {
      color: $color-text-secondary;
    }
  }

  &__related {
    margin-top: $space-16;

    > div {
      display: grid;
      gap: $space-5;
      margin-top: $space-6;
    }
  }

  &__missing {
    padding-block: $space-20;
  }

  @media (min-width: $breakpoint-md) {
    &__facts {
      grid-template-columns: repeat(2, 1fr);
    }

    &__related > div {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (min-width: $breakpoint-lg) {
    &__layout {
      grid-template-columns: minmax(0, 1fr) 20rem;
    }

    &__aside {
      position: sticky;
      top: calc($header-height + $space-5);
    }
  }
}
</style>

<template>
  <article class="job-card">
    <header class="job-card__header">
      <div>
        <DemoBadge v-if="job.isDemo" type="listing" />
        <h3><NuxtLink :to="getJobRoute(job.id, locale)">{{ job.title }}</NuxtLink></h3>
      </div>
      <BaseBadge v-if="job.isUrgent" variant="error">{{ t('jobs.card.urgent') }}</BaseBadge>
    </header>
    <div class="job-card__meta">
      <span><MapPin :size="16" />{{ cityName }} - {{ job.approximateArea }}</span>
      <span><CalendarDays :size="16" />{{ formatPublicDate(job.preferredDate, locale) }}</span>
      <span><Clock3 :size="16" />{{ job.preferredStartTime }}</span>
    </div>
    <div class="job-card__details">
      <span>{{ t('jobs.card.size', { value: job.sizeSquareMeters }) }}</span>
      <span>{{ t('jobs.card.rooms', { bedrooms: job.bedrooms, bathrooms: job.bathrooms }) }}</span>
      <span>{{ t('jobs.card.duration', { value: job.estimatedDurationHours }) }}</span>
    </div>
    <footer class="job-card__footer">
      <PriceDisplay
        :value="job.proposedBudget"
        :suffix="t(`jobs.budgetType.${job.budgetType}`)"
      />
      <span class="job-card__offers">{{ t('jobs.card.offers', { count: job.offerCount }) }}</span>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { CalendarDays, Clock3, MapPin } from '@lucide/vue'
import type { CleaningJob } from '~/domains/jobs/types'
import { formatPublicDate } from '~/utils/formatters'
import { getJobRoute } from '~/utils/routes'

defineProps<{ job: CleaningJob, cityName: string }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.job-card {
  display: grid;
  gap: $space-5;
  height: 100%;
  padding: $space-6;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  transition: transform $transition-base, box-shadow $transition-base;

  &:hover {
    box-shadow: $shadow-md;
    transform: translateY(-3px);
  }

  &__header,
  &__footer {
    display: flex;
    gap: $space-4;
    align-items: flex-start;
    justify-content: space-between;
  }

  h3 {
    margin-top: $space-3;
    font-size: $font-size-lg;
    line-height: 1.35;
  }

  h3 a {
    color: $color-text-primary;
    text-decoration: none;
  }

  &__meta {
    display: grid;
    gap: $space-2;
    font-size: $font-size-sm;
    color: $color-text-secondary;

    span {
      display: flex;
      gap: $space-2;
      align-items: center;
    }
  }

  &__details {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;

    span {
      padding: $space-2 $space-3;
      font-size: $font-size-xs;
      background: $color-background;
      border-radius: $radius-full;
    }
  }

  &__footer {
    align-items: end;
    padding-top: $space-4;
    border-top: 1px solid $color-border;
  }

  &__offers {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}
</style>

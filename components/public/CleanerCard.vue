<template>
  <article class="cleaner-card">
    <header class="cleaner-card__header">
      <BaseAvatar :name="fullName" size="lg" />
      <div class="cleaner-card__identity">
        <h3><NuxtLink :to="getCleanerRoute(cleaner.id, locale)">{{ fullName }}</NuxtLink></h3>
        <DemoBadge v-if="cleaner.isDemo" type="profile" />
        <p class="cleaner-card__location"><MapPin :size="15" />{{ cityName }}</p>
      </div>
    </header>
    <RatingSummary :value="cleaner.averageRating" :count="cleaner.ratingCount" />
    <p class="cleaner-card__bio">{{ cleaner.biography }}</p>
    <div class="cleaner-card__prices">
      <PriceDisplay :value="cleaner.hourlyRate" :suffix="t('cleaners.card.perHour')" />
      <span>{{ t('cleaners.card.minimum', { price: formatPrice(cleaner.minimumJobPrice, locale) }) }}</span>
    </div>
    <div class="cleaner-card__badges">
      <AvailabilityBadge :active="cleaner.bringsSupplies" :label="t('cleaners.card.supplies')" />
      <AvailabilityBadge :active="cleaner.ownTransportation" :label="t('cleaners.card.transport')" />
    </div>
    <footer>
      <span>{{ t('cleaners.card.completed', { count: cleaner.completedJobs }) }}</span>
      <BaseButton size="sm" variant="secondary" :to="getCleanerRoute(cleaner.id, locale)">
        {{ t('cleaners.card.viewProfile') }}
      </BaseButton>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import type { CleanerProfile } from '~/domains/users/types'
import { demoDisplayName } from '~/utils/demoPresentation'
import { formatPrice } from '~/utils/formatters'
import { getCleanerRoute } from '~/utils/routes'

const props = defineProps<{ cleaner: CleanerProfile, cityName: string }>()
const { t, locale } = useI18n()
const fullName = computed(() => demoDisplayName(
  props.cleaner.firstName,
  props.cleaner.lastName,
  props.cleaner.isDemo,
))
</script>

<style scoped lang="scss">
.cleaner-card {
  display: grid;
  gap: $space-4;
  height: 100%;
  padding: $space-6;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;

  &__header {
    display: flex;
    gap: $space-4;
    align-items: center;

    h3 {
      font-size: $font-size-lg;
    }

    a {
      color: $color-text-primary;
      text-decoration: none;
    }

    .cleaner-card__location {
      flex-basis: 100%;
      display: flex;
      gap: $space-1;
      align-items: center;
      margin-top: $space-1;
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }
  }

  &__identity {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    gap: $space-2;
    align-items: center;
    min-width: 0;
  }

  &__bio {
    display: -webkit-box;
    overflow: hidden;
    color: $color-text-secondary;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }

  &__prices {
    display: grid;
    gap: $space-1;

    > span {
      font-size: $font-size-xs;
      color: $color-text-secondary;
    }
  }

  &__badges {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
  }

  footer {
    display: flex;
    gap: $space-3;
    align-items: center;
    justify-content: space-between;
    padding-top: $space-4;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    border-top: 1px solid $color-border;
  }
}
</style>

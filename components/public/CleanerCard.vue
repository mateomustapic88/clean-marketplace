<template>
  <article class="cleaner-card">
    <header class="cleaner-card__header">
      <BaseAvatar :name="fullName" size="md" />
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
  gap: $space-3;
  height: 100%;
  padding: $space-5;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;

  &__header {
    display: flex;
    gap: $space-4;
    align-items: center;

    h3 {
      min-width: 0;
      font-size: $font-size-md;
      line-height: 1.35;

      a {
        overflow-wrap: anywhere;
      }
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
      font-size: $font-size-xs;
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
    min-height: 4.5em;
    max-height: 4.5em;
    overflow: hidden;
    font-size: $font-size-sm;
    line-height: 1.5;
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
    padding-top: $space-3;
    font-size: $font-size-xs;
    line-height: 1.4;
    color: $color-text-secondary;
    border-top: 1px solid $color-border;

    > span {
      min-width: 0;
    }

    :deep(.base-button) {
      flex: 0 0 auto;
    }
  }
}
</style>

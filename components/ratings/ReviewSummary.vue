<template>
  <BaseCard class="review-summary">
    <header><div><strong>{{ summary.average?.toFixed(1) ?? '-' }}</strong><span>{{ t('reviews.count', { count: summary.count }) }}</span></div><BaseRating :value="summary.average ?? 0" :count="summary.count" :label="t('reviews.overall')" /></header>
    <RatingDistribution :distribution="summary.distribution" />
    <dl><div v-for="(average, category) in summary.categoryAverages" :key="category"><dt>{{ t(`reviews.categories.${category}`) }}</dt><dd>{{ average?.toFixed(1) }}</dd></div></dl>
  </BaseCard>
</template>

<script setup lang="ts">
import type { RatingSummary } from '~/domains/ratings/types'

defineProps<{ summary: RatingSummary }>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.review-summary { display: grid; gap: $space-5; header { display: flex; flex-wrap: wrap; gap: $space-4; justify-content: space-between; } header div { display: grid; strong { font-size: $font-size-3xl; } span { color: $color-text-secondary; } } dl { display: grid; gap: $space-2; } dl div { display: flex; justify-content: space-between; } }
</style>

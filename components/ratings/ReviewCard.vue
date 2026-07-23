<template>
  <BaseCard class="review-card">
    <header><BaseRating :value="review.overallScore" :label="t('reviews.overall')" /><BaseBadge variant="success">{{ t('reviews.verified') }}</BaseBadge></header>
    <p v-if="review.comment">{{ review.comment }}</p>
    <dl><div v-for="item in review.categoryScores" :key="item.category"><dt>{{ t(`reviews.categories.${item.category}`) }}</dt><dd>{{ item.score }}/5</dd></div></dl>
  </BaseCard>
</template>

<script setup lang="ts">
import type { Rating } from '~/domains/ratings/types'

defineProps<{ review: Rating }>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.review-card { display: grid; gap: $space-4; header { display: flex; flex-wrap: wrap; gap: $space-3; justify-content: space-between; } dl { display: grid; gap: $space-2; } dl div { display: flex; gap: $space-3; justify-content: space-between; } dt { color: $color-text-secondary; } }
</style>

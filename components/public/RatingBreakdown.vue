<template>
  <div v-if="categories.length" class="rating-breakdown">
    <div
      v-for="category in categories"
      :key="category.name"
      class="rating-breakdown__item"
    >
      <div class="rating-breakdown__label">
        <span>{{ t(`ratingCategories.${category.name}`) }}</span>
        <strong>{{ formatRating(category.average) }}</strong>
      </div>
      <div
        class="rating-breakdown__track"
        role="progressbar"
        :aria-label="t('cleanerProfile.categoryRatingLabel', {
          category: t(`ratingCategories.${category.name}`),
          rating: formatRating(category.average),
        })"
        :aria-valuenow="category.average"
        aria-valuemin="0"
        aria-valuemax="5"
      >
        <span
          class="rating-breakdown__fill"
          :style="{ width: `${category.average * 20}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Rating, RatingCategory } from '~/domains/ratings/types'
import { formatRating } from '~/utils/formatters'

const props = defineProps<{ ratings: Rating[] }>()
const { t } = useI18n()

const categories = computed(() => {
  const grouped = new Map<RatingCategory, number[]>()

  for (const rating of props.ratings) {
    for (const item of rating.categoryScores) {
      grouped.set(item.category, [...(grouped.get(item.category) ?? []), item.score])
    }
  }

  return [...grouped.entries()].map(([name, scores]) => ({
    name,
    average: scores.reduce((total, score) => total + score, 0) / scores.length,
  }))
})
</script>

<style scoped lang="scss">
.rating-breakdown {
  display: grid;
  gap: $space-4;
  margin-bottom: $space-6;

  &__item {
    display: grid;
    gap: $space-2;
  }

  &__label {
    display: flex;
    justify-content: space-between;
    gap: $space-4;
    font-size: $font-size-sm;
  }

  &__track {
    height: 0.5rem;
    overflow: hidden;
    background: $color-border;
    border-radius: $radius-full;
  }

  &__fill {
    display: block;
    height: 100%;
    background: $color-accent;
    border-radius: inherit;
  }
}
</style>

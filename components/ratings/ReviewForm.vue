<template>
  <form class="review-form" @submit.prevent="$emit('submit', model)">
    <BaseSelect v-model.number="model.overallScore" required :label="t('reviews.overall')" :options="ratingOptions" />
    <div class="review-form__categories">
      <BaseSelect v-for="category in categories" :key="category" :model-value="scoreFor(category)" required :label="t(`reviews.categories.${category}`)" :options="ratingOptions" @update:model-value="setScore(category, Number($event))" />
    </div>
    <BaseTextarea v-model="model.comment" :label="t('reviews.comment')" />
    <BaseButton type="submit">{{ submitLabel }}</BaseButton>
  </form>
</template>

<script setup lang="ts">
import type { RatingCategory, RatingCategoryScore } from '~/domains/ratings/types'

const props = defineProps<{ categories: RatingCategory[], submitLabel: string }>()
defineEmits<{ submit: [value: { overallScore: number, categoryScores: RatingCategoryScore[], comment: string }] }>()
const model = defineModel<{ overallScore: number, categoryScores: RatingCategoryScore[], comment: string }>({ required: true })
const { t } = useI18n()
const ratingOptions = computed(() => [1, 2, 3, 4, 5].map((value) => ({ value, label: t('reviews.ratingOption', { value }) })))
const scoreFor = (category: RatingCategory) => model.value.categoryScores.find((item) => item.category === category)?.score ?? 5
const setScore = (category: RatingCategory, score: number) => {
  model.value.categoryScores = props.categories.map((item) => ({
    category: item,
    score: item === category ? score : scoreFor(item),
  }))
}
</script>

<style scoped lang="scss">
.review-form { display: grid; gap: $space-5; &__categories { display: grid; gap: $space-4; } @media (min-width: $breakpoint-md) { &__categories { grid-template-columns: repeat(2, minmax(0, 1fr)); } } }
</style>

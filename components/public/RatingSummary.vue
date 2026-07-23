<template>
  <div class="rating-summary" :aria-label="label">
    <Star :size="17" fill="currentColor" aria-hidden="true" />
    <strong v-if="formatted">{{ formatted }}</strong>
    <span v-else>{{ t('catalog.noRatings') }}</span>
    <span v-if="count > 0">({{ count }})</span>
  </div>
</template>

<script setup lang="ts">
import { Star } from '@lucide/vue'
import { formatRating } from '~/utils/formatters'

const props = defineProps<{ value: number | null, count: number }>()
const { t } = useI18n()
const formatted = computed(() => formatRating(props.value))
const label = computed(() => formatted.value
  ? t('catalog.ratingLabel', { rating: formatted.value, count: props.count })
  : t('catalog.noRatings'))
</script>

<style scoped lang="scss">
.rating-summary {
  display: inline-flex;
  gap: $space-1;
  align-items: center;
  font-size: $font-size-sm;
  color: $color-text-secondary;

  svg,
  strong {
    color: $color-accent;
  }
}
</style>

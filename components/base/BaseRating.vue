<template>
  <span class="base-rating" :aria-label="ariaLabel">
    <span class="base-rating__stars" aria-hidden="true">
      <Star
        v-for="index in 5"
        :key="index"
        :size="size"
        :fill="index <= roundedValue ? 'currentColor' : 'none'"
      />
    </span>
    <span v-if="showValue" class="base-rating__value">{{ formattedValue }}</span>
    <span v-if="count !== undefined" class="base-rating__count">({{ count }})</span>
  </span>
</template>

<script setup lang="ts">
import { Star } from '@lucide/vue'

const props = withDefaults(defineProps<{
  value: number
  count?: number
  size?: number
  showValue?: boolean
  label: string
}>(), {
  size: 16,
  showValue: true,
})

const roundedValue = computed(() => Math.round(Math.min(5, Math.max(0, props.value))))
const formattedValue = computed(() => props.value.toFixed(1))
const ariaLabel = computed(() => `${props.label}: ${formattedValue.value}`)
</script>

<style scoped lang="scss">
.base-rating {
  display: inline-flex;
  gap: $space-2;
  align-items: center;
  font-size: $font-size-sm;

  &__stars {
    display: inline-flex;
    gap: 0.1rem;
    color: $color-accent;
  }

  &__value {
    font-weight: $font-weight-semibold;
  }

  &__count {
    color: $color-text-secondary;
  }
}
</style>

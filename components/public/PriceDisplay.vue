<template>
  <span class="price-display">
    <strong>{{ formatPrice(value, locale, currency) }}</strong>
    <span v-if="suffix">{{ suffix }}</span>
  </span>
</template>

<script setup lang="ts">
import { formatPrice } from '~/utils/formatters'

withDefaults(defineProps<{ value: number, suffix?: string, currency?: 'EUR' | 'USD' }>(), {
  currency: 'EUR',
})
const { locale } = useI18n()
</script>

<style scoped lang="scss">
.price-display {
  display: inline-flex;
  gap: $space-1;
  align-items: baseline;

  strong {
    font-size: $font-size-xl;
    color: $color-primary-dark;
  }

  span {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}
</style>

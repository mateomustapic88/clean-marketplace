<template>
  <fieldset class="billing-period-toggle">
    <legend class="sr-only">{{ t('billing.choosePeriod') }}</legend>
    <label
      v-for="period in periods"
      :key="period"
      class="billing-period-toggle__option"
      :class="{ 'billing-period-toggle__option--active': modelValue === period }"
    >
      <input
        type="radio"
        :name="name"
        :value="period"
        :checked="modelValue === period"
        @change="$emit('update:modelValue', period)"
      >
      <span>{{ t(`billing.period.${period}`) }}</span>
      <small v-if="period === 'annual' && discountPercent > 0">{{ t('billing.save', { percent: discountPercent }) }}</small>
    </label>
  </fieldset>
</template>

<script setup lang="ts">
import type { BillingPeriod } from '~/domains/subscriptions/types'

defineProps<{ modelValue: BillingPeriod, discountPercent: number }>()
defineEmits<{ 'update:modelValue': [value: BillingPeriod] }>()
const { t } = useI18n()
const name = `billing-period-${useId()}`
const periods: BillingPeriod[] = ['monthly', 'annual']
</script>

<style scoped lang="scss">
.billing-period-toggle {
  display: inline-flex;
  gap: $space-1;
  padding: $space-1;
  border: 1px solid $color-border;
  border-radius: $radius-lg;

  &__option {
    position: relative;
    display: flex;
    gap: $space-2;
    align-items: center;
    padding: $space-3 $space-4;
    font-weight: $font-weight-semibold;
    cursor: pointer;
    border-radius: $radius-md;

    input {
      width: 1rem;
      height: 1rem;
      margin: 0;
      accent-color: $color-primary;
    }

    &:has(input:focus-visible) {
      outline: 3px solid $color-primary-light;
      outline-offset: 2px;
    }

    &--active {
      color: $color-surface;
      background: $color-primary;

      input {
        accent-color: $color-surface;
      }
    }

    small {
      font-size: $font-size-xs;
    }
  }

  @media (max-width: $breakpoint-sm) {
    display: grid;
    width: 100%;
  }
}
</style>

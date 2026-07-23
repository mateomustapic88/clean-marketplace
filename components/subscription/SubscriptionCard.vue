<template>
  <BaseCard class="subscription-card" :aria-labelledby="headingId">
    <header class="subscription-card__header">
      <div>
        <p class="subscription-card__eyebrow">{{ t('billing.currentPlan') }}</p>
        <h2 :id="headingId">{{ t(`billing.planName.${role}`) }}</h2>
      </div>
      <SubscriptionStatusBadge :status="presentation.status" />
    </header>
    <p class="subscription-card__price">
      {{ formatPrice(presentation.monthlyAmount / 100, locale) }}
      <small>/ {{ t('billing.month') }}</small>
    </p>
    <p class="subscription-card__trial">
      {{ t('billing.trial.included', { days: presentation.includedTrialDays }) }}
    </p>
    <div class="subscription-card__benefits">
      <h3>{{ t('billing.benefits.title') }}</h3>
      <ul>
        <li>{{ t(`billing.benefits.${role}.first`) }}</li>
        <li>{{ t(`billing.benefits.${role}.second`) }}</li>
        <li>{{ t(`billing.benefits.${role}.third`) }}</li>
      </ul>
    </div>
    <slot />
  </BaseCard>
</template>

<script setup lang="ts">
import type { Subscription } from '~/domains/subscriptions/types'
import type { BillingRole, PublicBillingPlan } from '~/services/billing/billingPresentation'
import { createBillingPresentation } from '~/services/billing/billingPresentation'
import { formatPrice } from '~/utils/formatters'

const props = defineProps<{
  role: BillingRole
  subscription: Subscription | null
}>()
const { t, locale } = useI18n()
const config = useRuntimeConfig()
const headingId = useId()
const presentation = computed(() => createBillingPresentation(
  props.role,
  props.subscription,
  config.public.plans[props.role] as PublicBillingPlan,
))
</script>

<style scoped lang="scss">
.subscription-card {
  display: grid;
  gap: $space-4;

  &__header {
    display: flex;
    gap: $space-4;
    align-items: start;
    justify-content: space-between;
  }

  &__eyebrow {
    margin-bottom: $space-2;
    color: $color-text-secondary;
  }

  &__price {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;

    small {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }
  }

  &__trial {
    font-weight: $font-weight-semibold;
    color: $color-primary-dark;
  }

  &__benefits {
    display: grid;
    gap: $space-2;

    ul {
      display: grid;
      gap: $space-2;
      padding-left: $space-5;
    }
  }
}
</style>

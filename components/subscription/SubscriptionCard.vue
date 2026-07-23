<template>
  <BaseCard class="subscription-card">
    <header><div><DemoBadge type="listing" /><h2>{{ t(`billing.plan.${subscription.plan}`) }}</h2></div><SubscriptionStatusBadge :status="subscription.status" /></header>
    <p class="subscription-card__price">{{ formatPrice(subscription.unitAmount / 100, locale) }} <small>/ {{ t('billing.month') }}</small></p>
    <p v-if="subscription.currentPeriodEndsAt">{{ t('billing.renewal') }}: {{ formatPublicDate(subscription.currentPeriodEndsAt.slice(0, 10), locale) }}</p>
    <slot />
  </BaseCard>
</template>

<script setup lang="ts">
import type { Subscription } from '~/domains/subscriptions/types'
import { formatPrice, formatPublicDate } from '~/utils/formatters'

defineProps<{ subscription: Subscription }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.subscription-card { display: grid; gap: $space-4; header { display: flex; gap: $space-4; align-items: start; justify-content: space-between; } h2 { margin-top: $space-2; } &__price { font-size: $font-size-3xl; font-weight: $font-weight-bold; small { font-size: $font-size-sm; color: $color-text-secondary; } } }
</style>

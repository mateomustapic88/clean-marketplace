<template>
  <dl class="billing-summary">
    <div><dt>{{ t('billing.currentPlan') }}</dt><dd>{{ t(`billing.plan.${subscription.plan}`) }}</dd></div>
    <div><dt>{{ t('billing.subscriptionStatus') }}</dt><dd><SubscriptionStatusBadge :status="subscription.status" /></dd></div>
    <div v-if="subscription.status === 'trial'"><dt>{{ t('billing.trialRemaining') }}</dt><dd>{{ t('billing.trial.remaining', { days: trialDays }) }}</dd></div>
    <div><dt>{{ t('billing.renewal') }}</dt><dd>{{ subscription.currentPeriodEndsAt ? formatPublicDate(subscription.currentPeriodEndsAt.slice(0, 10), locale) : t('common.notAvailable') }}</dd></div>
    <div><dt>{{ t('billing.cancellationState') }}</dt><dd>{{ subscription.cancelAtPeriodEnd ? t('billing.cancelsAtPeriodEnd') : t('billing.renewsAutomatically') }}</dd></div>
    <div v-if="subscription.lastFailedPaymentAt"><dt>{{ t('billing.lastFailedPayment') }}</dt><dd>{{ formatPublicDate(subscription.lastFailedPaymentAt.slice(0, 10), locale) }}</dd></div>
  </dl>
</template>

<script setup lang="ts">
import type { Subscription } from '~/domains/subscriptions/types'
import { formatPublicDate } from '~/utils/formatters'

defineProps<{ subscription: Subscription, trialDays: number }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.billing-summary { display: grid; gap: $space-3; div { display: flex; gap: $space-4; justify-content: space-between; padding-bottom: $space-3; border-bottom: 1px solid $color-border; } dt { color: $color-text-secondary; } dd { font-weight: $font-weight-semibold; } }
</style>

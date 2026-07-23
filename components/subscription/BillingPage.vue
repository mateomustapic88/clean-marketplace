<template>
  <div class="billing-page">
    <header><h1>{{ t('billing.title') }}</h1><p>{{ t('billing.description') }}</p></header>
    <BaseAlert v-if="showMockWarning" variant="warning" :title="t('billing.mockModeTitle')">{{ t('billing.mockModeDescription') }}</BaseAlert>
    <BaseAlert v-else-if="showWebhookWarning" variant="warning" :title="t('billing.webhookWarningTitle')">{{ t('billing.webhookWarningDescription') }}</BaseAlert>
    <TrialBanner :subscription="subscription" :days="trialDays" />
    <div v-if="subscription" class="billing-page__grid">
      <SubscriptionCard :subscription="subscription"><BillingSummary :subscription="subscription" /></SubscriptionCard>
      <PaymentMethodCard :method="paymentMethod" />
    </div>
    <div v-if="subscription" class="billing-page__actions">
      <BaseButton v-if="!subscription.stripeSubscriptionId" @click="$emit('checkout')">{{ t('billing.checkout') }}</BaseButton>
      <BaseButton v-if="subscription.stripeCustomerId" variant="secondary" @click="$emit('portal')">{{ t('billing.portal') }}</BaseButton>
      <BaseButton v-if="subscription.cancelAtPeriodEnd || subscription.status === 'cancelled'" variant="secondary" @click="$emit('resume')">{{ t('billing.resume') }}</BaseButton>
      <BaseButton v-else variant="danger" @click="$emit('cancel')">{{ t('billing.cancel') }}</BaseButton>
      <BaseButton variant="ghost" disabled>{{ t('billing.downgradePlaceholder') }}</BaseButton>
    </div>
    <section><h2>{{ t('billing.invoices') }}</h2><InvoiceTable :invoices="invoices" /></section>
  </div>
</template>

<script setup lang="ts">
import type { BillingInvoice, PaymentMethod, Subscription } from '~/domains/subscriptions/types'

defineProps<{ subscription: Subscription | null, invoices: BillingInvoice[], paymentMethod: PaymentMethod | null, trialDays: number }>()
defineEmits<{ checkout: [], portal: [], cancel: [], resume: [] }>()
const { t } = useI18n()
const config = useRuntimeConfig()
const showMockWarning = computed(() =>
  config.public.billingMode === 'mock'
  && config.public.billingEnvironment.development,
)
const showWebhookWarning = computed(() =>
  config.public.billingMode === 'stripe'
  && config.public.billingEnvironment.development
  && !config.public.billingEnvironment.webhookConfigured,
)
</script>

<style scoped lang="scss">
.billing-page { display: grid; gap: $space-6; > header h1 { font-size: $font-size-3xl; } > header p { color: $color-text-secondary; } &__grid { display: grid; gap: $space-5; } &__actions { display: flex; flex-wrap: wrap; gap: $space-3; } section { display: grid; gap: $space-4; } @media (min-width: $breakpoint-lg) { &__grid { grid-template-columns: 1.2fr .8fr; } } }
</style>

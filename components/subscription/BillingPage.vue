<template>
  <div class="billing-page">
    <header><h1>{{ t('billing.title') }}</h1><p>{{ t('billing.description') }}</p></header>
    <BaseAlert v-if="showMockWarning" variant="warning" :title="t('billing.mockModeTitle')">{{ t('billing.mockModeDescription') }}</BaseAlert>
    <BaseAlert v-else-if="showWebhookWarning" variant="warning" :title="t('billing.webhookWarningTitle')">{{ t('billing.webhookWarningDescription') }}</BaseAlert>
    <BaseAlert v-if="showPublishRequirement" variant="info" :title="t('billing.publishRequiredTitle')">{{ t('billing.publishRequiredDescription') }}</BaseAlert>
    <BaseAlert v-if="loadError" variant="warning" :title="t('billing.loadErrorTitle')">{{ t('billing.loadErrorDescription') }}</BaseAlert>
    <BaseAlert v-if="actionError" variant="error" :title="t('billing.actionErrorTitle')">{{ t('billing.actionErrorDescription') }}</BaseAlert>
    <TrialBanner :subscription="subscription" :days="trialDays" />
    <div class="billing-page__grid" :aria-busy="isLoading">
      <SubscriptionCard :role="role" :subscription="subscription" :billing-period="selectedBillingPeriod">
        <BillingSummary v-if="subscription" :subscription="subscription" :trial-days="trialDays" />
      </SubscriptionCard>
      <PaymentMethodCard :method="paymentMethod" />
    </div>
    <section class="billing-page__management" aria-labelledby="billing-management-title">
      <h2 id="billing-management-title">{{ t('billing.manage') }}</h2>
      <BillingPeriodToggle v-if="checkoutAction" v-model="selectedBillingPeriod" :discount-percent="annualDiscountPercent" />
      <div class="billing-page__actions">
        <BaseButton v-if="checkoutAction" :loading="isActionLoading" :disabled="isLoading" @click="$emit('checkout', selectedBillingPeriod)">{{ t(`billing.${checkoutAction}`) }}</BaseButton>
        <BaseButton v-if="subscription?.stripeCustomerId" variant="secondary" :loading="isActionLoading" @click="$emit('portal')">{{ t('billing.portal') }}</BaseButton>
        <BaseButton v-if="hasProviderSubscription && (subscription?.cancelAtPeriodEnd || subscription?.status === 'cancelled')" variant="secondary" :disabled="isActionLoading" @click="$emit('resume')">{{ t('billing.resume') }}</BaseButton>
        <BaseButton v-else-if="hasProviderSubscription" variant="danger" :disabled="isActionLoading" @click="$emit('cancel')">{{ t('billing.cancel') }}</BaseButton>
      </div>
    </section>
    <section><h2>{{ t('billing.invoices') }}</h2><InvoiceTable :invoices="invoices" /></section>
  </div>
</template>

<script setup lang="ts">
import type { BillingInvoice, BillingPeriod, PaymentMethod, Subscription } from '~/domains/subscriptions/types'
import type { BillingRole } from '~/services/billing/billingPresentation'
import { calculateAnnualSavings, getBillingCheckoutAction } from '~/services/billing/billingPresentation'

const props = defineProps<{
  role: BillingRole
  subscription: Subscription | null
  invoices: BillingInvoice[]
  paymentMethod: PaymentMethod | null
  trialDays: number
  isLoading: boolean
  loadError: boolean
  actionError: boolean
  isActionLoading: boolean
}>()
defineEmits<{ checkout: [billingPeriod: BillingPeriod], portal: [], cancel: [], resume: [] }>()
const { t } = useI18n()
const route = useRoute()
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
const showPublishRequirement = computed(() =>
  props.role === 'owner' && route.query.reason === 'publish_jobs',
)
const hasProviderSubscription = computed(() => Boolean(props.subscription?.stripeSubscriptionId))
const checkoutAction = computed(() => getBillingCheckoutAction(props.subscription))
const selectedBillingPeriod = ref<BillingPeriod>(props.subscription?.billingPeriod ?? 'monthly')
const plan = computed(() => config.public.plans[props.role])
const annualDiscountPercent = computed(() => calculateAnnualSavings(plan.value).percent)
</script>

<style scoped lang="scss">
.billing-page {
  display: grid;
  gap: $space-6;

  > header h1 {
    font-size: $font-size-3xl;
  }

  > header p {
    color: $color-text-secondary;
  }

  &__grid,
  &__management {
    display: grid;
    gap: $space-5;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
  }

  section {
    display: grid;
    gap: $space-4;
  }

  @media (min-width: $breakpoint-lg) {
    &__grid {
      grid-template-columns: 1.2fr .8fr;
    }
  }
}
</style>

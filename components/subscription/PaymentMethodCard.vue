<template>
  <BaseCard class="payment-method-card">
    <h2>{{ t('billing.paymentMethod') }}</h2>
    <p v-if="method"><strong>{{ method.brand.toUpperCase() }} **** {{ method.last4 }}</strong><span>{{ t('billing.expires', { month: method.expiryMonth, year: method.expiryYear }) }}</span></p>
    <p v-else>{{ t('billing.noPaymentMethod') }}</p>
  </BaseCard>
</template>

<script setup lang="ts">
import type { PaymentMethod } from '~/domains/subscriptions/types'

defineProps<{ method: PaymentMethod | null }>()
const { t } = useI18n()
</script>

<style scoped lang="scss">
.payment-method-card { display: grid; gap: $space-3; p { display: flex; flex-wrap: wrap; gap: $space-3; justify-content: space-between; } span { color: $color-text-secondary; } }
</style>

<template>
  <div class="invoice-table">
    <table>
      <caption class="sr-only">{{ t('billing.invoices') }}</caption>
      <thead><tr><th scope="col">{{ t('billing.invoiceNumber') }}</th><th scope="col">{{ t('billing.date') }}</th><th scope="col">{{ t('billing.amount') }}</th><th scope="col">{{ t('billing.invoiceStatus') }}</th></tr></thead>
      <tbody><tr v-for="invoice in invoices" :key="invoice.id"><td>{{ invoice.number }}</td><td>{{ formatPublicDate(invoice.issuedAt.slice(0, 10), locale) }}</td><td>{{ formatPrice(invoice.amountPaid / 100, locale) }}</td><td>{{ t(`billing.invoiceStatuses.${invoice.status}`) }}</td></tr></tbody>
    </table>
    <BaseEmptyState v-if="!invoices.length" :title="t('billing.noInvoices')" :description="t('billing.noInvoicesDescription')" />
  </div>
</template>

<script setup lang="ts">
import type { BillingInvoice } from '~/domains/subscriptions/types'
import { formatPrice, formatPublicDate } from '~/utils/formatters'

defineProps<{ invoices: BillingInvoice[] }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.invoice-table { overflow-x: auto; table { width: 100%; border-collapse: collapse; } th, td { padding: $space-3; text-align: left; border-bottom: 1px solid $color-border; } }
</style>

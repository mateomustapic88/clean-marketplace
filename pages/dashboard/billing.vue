<template>
  <BillingPage role="owner" :subscription="store.subscription" :invoices="store.invoices" :payment-method="store.paymentMethod" :trial-days="store.trialDaysRemaining" :is-loading="store.isLoading" :load-error="store.loadError" :action-error="store.actionError" :is-action-loading="store.isActionLoading" @checkout="checkout" @portal="portal" @cancel="cancel" @resume="resume" />
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { BillingPeriod } from '~/domains/subscriptions/types'
import { useSubscriptionStore } from '~/stores/subscription'
import { getAppRoute } from '~/utils/routes'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'role'], roles: ['owner'] })
defineI18nRoute({ paths: { hr: '/dashboard/billing', en: '/dashboard/billing', sl: '/nadzorna-plosca/obracun' } })
const auth = useAuthStore()
const store = useSubscriptionStore()
const { t, locale } = useI18n()
const load = async () => {
  if (auth.user)
    await store.loadForUser(auth.user.id, auth.user.role)
}
watch(() => auth.user?.id, load, { immediate: true })
const returnUrl = computed(() => getAppRoute('ownerBilling', locale.value))
const checkout = async (billingPeriod: BillingPeriod) => {
  if (auth.user?.role === 'owner')
    await store.checkout(auth.user.id, 'owner', billingPeriod, returnUrl.value)
}
const portal = async () => {
  await store.openPortal(returnUrl.value)
}
const cancel = async () => {
  if (auth.user)
    await store.cancel(auth.user.id, auth.user.role)
}
const resume = async () => {
  if (auth.user)
    await store.resume(auth.user.id, auth.user.role)
}
useSeoMeta({ title: () => t('billing.metaTitle'), robots: 'noindex, nofollow' })
</script>

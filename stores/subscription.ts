import { defineStore } from 'pinia'
import type {
  BillingRedirect,
  BillingState,
} from '~/domains/subscriptions/api'
import type {
  BillingInvoice,
  BillingPeriod,
  PaymentMethod,
  Subscription,
  SubscriptionCapability,
  SubscriptionStatus,
} from '~/domains/subscriptions/types'
import type { UserRole } from '~/domains/users/types'
import { hasActiveSubscription, trialRemainingDays } from '~/services/subscriptions/subscriptionAccess'

export const useSubscriptionStore = defineStore('subscription', () => {
  const subscription = ref<Subscription | null>(null)
  const subscriptions = ref<Subscription[]>([])
  const invoices = ref<BillingInvoice[]>([])
  const paymentMethod = ref<PaymentMethod | null>(null)
  const capabilities = ref<Record<SubscriptionCapability, boolean>>({
    publish_jobs: false,
    submit_offers: false,
    view_contact: false,
  })
  const isLoading = ref(false)
  const loadError = ref(false)
  const actionError = ref(false)
  const isActionLoading = ref(false)
  const isActive = computed(() => hasActiveSubscription(subscription.value))
  const trialDaysRemaining = computed(() => trialRemainingDays(subscription.value))
  const repositories = () => useNuxtApp().$repositories
  const isStripeMode = () => useRuntimeConfig().public.billingMode === 'stripe'

  const loadForUser = async (userId: string, role: UserRole) => {
    if (role === 'admin') return
    isLoading.value = true
    loadError.value = false
    try {
      if (isStripeMode()) {
        const state = await $fetch<BillingState>('/api/billing/state')
        subscription.value = state.subscription ?? null
        invoices.value = state.invoices ?? []
        paymentMethod.value = state.paymentMethod ?? null
        if (state.subscription) {
          await repositories().subscriptions.sync(state.subscription)
        }
        capabilities.value = {
          publish_jobs: role === 'owner' && hasActiveSubscription(state.subscription),
          submit_offers: role === 'cleaner' && hasActiveSubscription(state.subscription),
          view_contact: role === 'cleaner' && hasActiveSubscription(state.subscription),
        }
        return
      }
      await repositories().subscriptions.ensureTrial(userId, role)
      const [current, invoiceList, method, publish, offer, contact] = await Promise.all([
        repositories().subscriptions.getByUserId(userId),
        repositories().subscriptions.listInvoices(userId),
        repositories().subscriptions.getPaymentMethod(userId),
        repositories().subscriptions.can(userId, role, 'publish_jobs'),
        repositories().subscriptions.can(userId, role, 'submit_offers'),
        repositories().subscriptions.can(userId, role, 'view_contact'),
      ])
      subscription.value = current
      invoices.value = invoiceList
      paymentMethod.value = method
      capabilities.value = { publish_jobs: publish, submit_offers: offer, view_contact: contact }
    }
    catch {
      subscription.value = null
      invoices.value = []
      paymentMethod.value = null
      capabilities.value = {
        publish_jobs: false,
        submit_offers: false,
        view_contact: false,
      }
      loadError.value = true
    }
    finally {
      isLoading.value = false
    }
  }

  const loadAll = async () => {
    subscriptions.value = await repositories().subscriptions.list()
  }

  const updateStatus = async (userId: string, role: UserRole, status: SubscriptionStatus) => {
    subscription.value = await repositories().subscriptions.updateStatus(userId, status)
    await loadForUser(userId, role)
  }

  const cancel = async (userId: string, role: UserRole) => {
    if (isStripeMode()) {
      await $fetch('/api/billing/cancel', {
        method: 'POST',
      })
      await loadForUser(userId, role)
      return
    }
    subscription.value = await repositories().subscriptions.cancel(userId)
    await loadForUser(userId, role)
  }

  const resume = async (userId: string, role: UserRole) => {
    if (isStripeMode()) {
      await $fetch('/api/billing/resume', {
        method: 'POST',
      })
      await loadForUser(userId, role)
      return
    }
    subscription.value = await repositories().subscriptions.resume(userId)
    await loadForUser(userId, role)
  }

  const checkout = async (userId: string, role: Exclude<UserRole, 'admin'>, billingPeriod: BillingPeriod, returnUrl: string) => {
    isActionLoading.value = true
    actionError.value = false
    try {
      if (isStripeMode()) {
        const redirect = await $fetch<BillingRedirect>('/api/billing/checkout', {
          method: 'POST',
          body: {
            role,
            billingPeriod,
          },
        })
        await navigateTo(redirect.url, { external: true })
        return redirect
      }
      const redirect = await useNuxtApp().$stripe.createCheckout({
        userId,
        plan: role,
        billingPeriod,
        customerId: subscription.value?.stripeCustomerId ?? null,
        successUrl: returnUrl,
        cancelUrl: returnUrl,
        trialDays: trialDaysRemaining.value,
      })
      await repositories().subscriptions.activateFromCheckout(
        userId,
        subscription.value?.stripeCustomerId ?? `cus_mock_${userId}`,
        `sub_mock_${userId}`,
        billingPeriod,
      )
      await loadForUser(userId, role)
      await navigateTo(redirect.url)
      return redirect
    }
    catch {
      actionError.value = true
      return null
    }
    finally {
      isActionLoading.value = false
    }
  }

  const openPortal = async (returnUrl: string) => {
    if (!subscription.value?.stripeCustomerId) return null
    isActionLoading.value = true
    actionError.value = false
    try {
      if (isStripeMode()) {
        const redirect = await $fetch<BillingRedirect>('/api/billing/portal', {
          method: 'POST',
          body: {
            returnPath: returnUrl,
          },
        })
        await navigateTo(redirect.url, { external: true })
        return redirect
      }
      const redirect = await useNuxtApp().$stripe.createCustomerPortal(
        subscription.value.stripeCustomerId,
        returnUrl,
      )
      await navigateTo(redirect.url)
      return redirect
    }
    catch {
      actionError.value = true
      return null
    }
    finally {
      isActionLoading.value = false
    }
  }

  return {
    subscription,
    subscriptions,
    invoices,
    paymentMethod,
    capabilities,
    isLoading,
    loadError,
    actionError,
    isActionLoading,
    isActive,
    trialDaysRemaining,
    loadForUser,
    loadAll,
    updateStatus,
    cancel,
    resume,
    checkout,
    openPortal,
  }
})

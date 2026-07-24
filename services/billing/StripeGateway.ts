import type { BillingPeriod } from '~/domains/subscriptions/types'

export interface CheckoutRequest {
  userId: string
  plan: 'owner' | 'cleaner'
  billingPeriod: BillingPeriod
  customerId: string | null
  successUrl: string
  cancelUrl: string
  trialDays: number
}

export interface StripeRedirect {
  id: string
  url: string
}

export interface StripeGateway {
  createCheckout(request: CheckoutRequest): Promise<StripeRedirect>
  createCustomerPortal(customerId: string, returnUrl: string): Promise<StripeRedirect>
}

import type {
  BillingInvoice,
  PaymentMethod,
  Subscription,
} from '~/domains/subscriptions/types'

export interface BillingState {
  subscription: Subscription | null
  invoices: BillingInvoice[]
  paymentMethod: PaymentMethod | null
}

export interface BillingRedirect {
  url: string
}

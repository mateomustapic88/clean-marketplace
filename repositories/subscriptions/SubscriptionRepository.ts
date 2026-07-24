import type {
  BillingInvoice,
  BillingPeriod,
  PaymentMethod,
  Subscription,
  SubscriptionCapability,
  SubscriptionStatus,
} from '~/domains/subscriptions/types'
import type { UserRole } from '~/domains/users/types'

export interface SubscriptionRepository {
  getByUserId(userId: string): Promise<Subscription | null>
  ensureTrial(userId: string, role: Exclude<UserRole, 'admin'>): Promise<Subscription>
  list(): Promise<Subscription[]>
  listInvoices(userId: string): Promise<BillingInvoice[]>
  getPaymentMethod(userId: string): Promise<PaymentMethod | null>
  updateStatus(userId: string, status: SubscriptionStatus): Promise<Subscription>
  cancel(userId: string): Promise<Subscription>
  resume(userId: string): Promise<Subscription>
  activateFromCheckout(userId: string, stripeCustomerId: string, stripeSubscriptionId: string, billingPeriod: BillingPeriod): Promise<Subscription>
  markPastDue(userId: string): Promise<Subscription>
  sync(subscription: Subscription): Promise<Subscription>
  can(userId: string, role: UserRole, capability: SubscriptionCapability): Promise<boolean>
}

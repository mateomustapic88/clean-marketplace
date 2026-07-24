import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  BillingInvoice, BillingPeriod, PaymentMethod, Subscription, SubscriptionCapability, SubscriptionStatus,
} from '~/domains/subscriptions/types'
import type { UserRole } from '~/domains/users/types'
import type { SubscriptionRepository } from '~/repositories/subscriptions/SubscriptionRepository'
import { canUseSubscriptionCapability } from '~/services/subscriptions/subscriptionAccess'
import { throwIfSupabaseError } from './helpers'
import { mapInvoice, mapPaymentMethod, mapSubscription } from './mappers'
import type { DbRow } from './mappers'

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly client: SupabaseClient) {}
  async getByUserId(userId: string): Promise<Subscription | null> {
    const { data, error } = await this.client.from('subscriptions').select('*').eq('user_id', userId).maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapSubscription(data as DbRow) : null
  }

  async ensureTrial(userId: string, _role: Exclude<UserRole, 'admin'>): Promise<Subscription> {
    const existing = await this.getByUserId(userId)
    if (!existing) throw new Error('A real trial begins only through Stripe Checkout')
    return existing
  }

  async list(): Promise<Subscription[]> {
    const { data, error } = await this.client.from('subscriptions').select('*').order('created_at', { ascending: false })
    throwIfSupabaseError(error)
    return (data as DbRow[]).map(mapSubscription)
  }

  async listInvoices(userId: string): Promise<BillingInvoice[]> {
    const { data, error } = await this.client.from('billing_invoices').select('*').eq('user_id', userId).order('issued_at', { ascending: false })
    throwIfSupabaseError(error)
    return (data as DbRow[]).map(mapInvoice)
  }

  async getPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    const { data, error } = await this.client.from('payment_methods').select('*').eq('user_id', userId).eq('is_default', true).maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapPaymentMethod(data as DbRow) : null
  }

  async updateStatus(_userId: string, _status: SubscriptionStatus): Promise<Subscription> { return this.serverOnly() }
  async cancel(_userId: string): Promise<Subscription> { return this.serverOnly() }
  async resume(_userId: string): Promise<Subscription> { return this.serverOnly() }
  async activateFromCheckout(_userId: string, _customer: string, _subscription: string, _billingPeriod: BillingPeriod): Promise<Subscription> { return this.serverOnly() }
  async markPastDue(_userId: string): Promise<Subscription> { return this.serverOnly() }
  async sync(subscription: Subscription): Promise<Subscription> { return subscription }
  async can(userId: string, role: UserRole, capability: SubscriptionCapability): Promise<boolean> {
    return canUseSubscriptionCapability(role, await this.getByUserId(userId), capability)
  }

  private serverOnly(): never { throw new Error('Subscription mutations are server-only') }
}

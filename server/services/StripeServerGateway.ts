import type Stripe from 'stripe'
import type { BillingPeriod } from '~/domains/subscriptions/types'
import type {
  CheckoutRequest,
  StripeGateway,
  StripeRedirect,
} from '~/services/billing/StripeGateway'

export class StripeServerGateway implements StripeGateway {
  constructor(
    private readonly stripe: Stripe,
    private readonly priceIds: Record<'owner' | 'cleaner', Record<BillingPeriod, string>>,
  ) {}

  async createCheckout(request: CheckoutRequest): Promise<StripeRedirect> {
    const price = this.priceIds[request.plan][request.billingPeriod]
    if (!price) throw createError({ statusCode: 503, statusMessage: 'Stripe price is not configured' })
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: request.userId,
      ...(request.customerId ? { customer: request.customerId } : {}),
      line_items: [{ price, quantity: 1 }],
      metadata: { userId: request.userId, role: request.plan, plan: request.plan, billingPeriod: request.billingPeriod },
      subscription_data: {
        metadata: { userId: request.userId, role: request.plan, plan: request.plan, billingPeriod: request.billingPeriod },
        ...(request.trialDays > 0
          ? { trial_period_days: request.trialDays }
          : {}),
      },
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      allow_promotion_codes: true,
    })
    if (!session.url) throw createError({ statusCode: 502, statusMessage: 'Stripe checkout URL is missing' })
    return { id: session.id, url: session.url }
  }

  async createCustomerPortal(customerId: string, returnUrl: string): Promise<StripeRedirect> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return { id: session.id, url: session.url }
  }
}

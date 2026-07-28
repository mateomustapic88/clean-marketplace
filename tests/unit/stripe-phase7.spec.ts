import type Stripe from 'stripe'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saasConfig } from '~/config/saas'
import type { Subscription } from '~/domains/subscriptions/types'
import { MockDatabase } from '~/repositories/mock/MockDatabase'
import { MockJobRepository } from '~/repositories/mock/MockJobRepository'
import { MockOfferRepository } from '~/repositories/mock/MockOfferRepository'
import { MockStripeEventRepository } from '~/repositories/mock/MockStripeEventRepository'
import {
  createBillingPresentation,
  calculateAnnualSavings,
  getBillingCheckoutAction,
  type PublicBillingPlan,
} from '~/services/billing/billingPresentation'
import {
  parseBillingMode,
  resolveBillingMode,
  validateStripeServerConfiguration,
} from '~/services/billing/billingConfiguration'
import { StripeServerGateway } from '~/server/services/StripeServerGateway'
import { processVerifiedStripeEvent } from '~/server/services/processStripeWebhook'
import { checkoutRequestSchema } from '~/server/schemas/billing'
import {
  requireWebhookSecret,
  verifyStripeWebhookEvent,
} from '~/server/utils/webhookConfiguration'
import {
  blocksNewProviderCheckout,
  invoicePaymentPatch,
  isOlderStripeEvent,
  shouldReconcileSubscription,
  statusFromStripe,
  stripeSubscriptionIdFromInvoice,
  subscriptionPatchFromStripe,
} from '~/server/services/StripeBillingService'
import type { StripeBillingService } from '~/server/services/StripeBillingService'
import {
  canUseSubscriptionCapability,
  hasActiveSubscription,
} from '~/services/subscriptions/subscriptionAccess'

const checkoutRequest = {
  userId: 'owner-user-01',
  plan: 'owner' as const,
  billingPeriod: 'monthly' as const,
  customerId: 'cus_owner',
  successUrl: 'https://example.test/dashboard/billing?checkout=success',
  cancelUrl: 'https://example.test/dashboard/billing?checkout=cancelled',
  trialDays: 7,
}

describe('Phase 7 Stripe architecture', () => {
  it('maps each role to its server-selected Stripe Price ID and seven-day trial', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'cs_test',
      url: 'https://checkout.stripe.test/session',
    })
    const stripe = {
      checkout: { sessions: { create } },
    } as unknown as Stripe
    const gateway = new StripeServerGateway(stripe, {
      owner: { monthly: 'price_owner_monthly', annual: 'price_owner_annual' },
      cleaner: { monthly: 'price_cleaner_monthly', annual: 'price_cleaner_annual' },
    })

    await gateway.createCheckout(checkoutRequest)
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
      line_items: [{ price: 'price_owner_monthly', quantity: 1 }],
      subscription_data: expect.objectContaining({ trial_period_days: 7 }),
    }))

    await gateway.createCheckout({
      ...checkoutRequest,
      userId: 'cleaner-user-01',
      plan: 'cleaner',
      billingPeriod: 'annual',
    })
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
      line_items: [{ price: 'price_cleaner_annual', quantity: 1 }],
    }))

    await gateway.createCheckout({ ...checkoutRequest, billingPeriod: 'annual' })
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
      line_items: [{ price: 'price_owner_annual', quantity: 1 }],
    }))

    await gateway.createCheckout({ ...checkoutRequest, plan: 'cleaner' })
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
      line_items: [{ price: 'price_cleaner_monthly', quantity: 1 }],
    }))
  })

  it('uses centralized role prices and trial duration for presentation', () => {
    expect(saasConfig.plans.owner.monthlyAmount).toBe(1900)
    expect(saasConfig.plans.cleaner.monthlyAmount).toBe(3900)
    expect(saasConfig.plans.owner.annualAmount).toBe(9900)
    expect(saasConfig.plans.cleaner.annualAmount).toBe(19900)
    expect(calculateAnnualSavings(saasConfig.plans.owner)).toEqual({ amount: 12900, percent: 57 })
    expect(calculateAnnualSavings(saasConfig.plans.cleaner)).toEqual({ amount: 26900, percent: 57 })
    expect(saasConfig.currency).toBe('EUR')
    expect(saasConfig.trialDays).toBe(7)
  })

  it('presents the configured role plan when the API returns no subscription', () => {
    const ownerPlan: PublicBillingPlan = {
      monthlyAmount: 1900,
      annualAmount: 9900,
      currency: 'EUR',
      trialDays: 7,
    }
    const cleanerPlan: PublicBillingPlan = {
      monthlyAmount: 3900,
      annualAmount: 19900,
      currency: 'EUR',
      trialDays: 7,
    }

    expect(createBillingPresentation('owner', null, ownerPlan, 'annual')).toEqual({
      role: 'owner',
      amount: 9900,
      billingPeriod: 'annual',
      annualDiscountPercent: 57,
      currency: 'EUR',
      includedTrialDays: 7,
      status: 'not_subscribed',
      hasProviderSubscription: false,
    })
    expect(createBillingPresentation('cleaner', null, cleanerPlan, 'monthly')).toMatchObject({
      role: 'cleaner',
      amount: 3900,
      billingPeriod: 'monthly',
      includedTrialDays: 7,
      status: 'not_subscribed',
      hasProviderSubscription: false,
    })
  })

  it('presents existing subscription status without replacing public plan pricing', () => {
    const presentation = createBillingPresentation('owner', {
      status: 'active',
      stripeSubscriptionId: 'provider-subscription',
      billingPeriod: 'monthly',
      unitAmount: 1900,
    } as Subscription, {
      monthlyAmount: 1900,
      annualAmount: 9900,
      currency: 'EUR',
      trialDays: 7,
    }, 'monthly')

    expect(presentation).toMatchObject({
      amount: 1900,
      status: 'active',
      hasProviderSubscription: true,
    })
  })

  it('selects a checkout label that matches the current subscription state', () => {
    expect(getBillingCheckoutAction(null)).toBe('startTrial')
    expect(getBillingCheckoutAction({
      status: 'trial',
    } as Subscription)).toBe('completeTrialSetup')
    expect(getBillingCheckoutAction({
      status: 'expired',
    } as Subscription)).toBe('checkout')
    expect(getBillingCheckoutAction({
      status: 'trial',
      stripeSubscriptionId: 'provider-subscription',
    } as Subscription)).toBeNull()
  })

  it('maps Stripe lifecycle data without trusting client subscription state', () => {
    const patch = subscriptionPatchFromStripe({
      id: 'sub_provider',
      customer: 'cus_provider',
      status: 'active',
      metadata: { userId: 'owner-user-01', plan: 'owner' },
      trial_start: 1_720_000_000,
      trial_end: 1_720_604_800,
      canceled_at: null,
      cancel_at_period_end: false,
      items: {
        data: [{
          price: { id: 'price_server_selected', unit_amount: 1900, recurring: { interval: 'month' } },
          current_period_start: 1_720_604_800,
          current_period_end: 1_723_196_800,
        }],
      },
    } as unknown as Stripe.Subscription)
    expect(patch).toMatchObject({
      customerId: 'cus_provider',
      stripeSubscriptionId: 'sub_provider',
      stripePriceId: 'price_server_selected',
      plan: 'owner',
      status: 'active',
      unitAmount: 1900,
      billingPeriod: 'monthly',
      stripeInterval: 'month',
      cancelAtPeriodEnd: false,
    })
    expect(patch.trialEndsAt).toBe('2024-07-10T09:46:40.000Z')
    expect(statusFromStripe('canceled')).toBe('cancelled')
    expect(statusFromStripe('past_due')).toBe('past_due')
    expect(statusFromStripe('incomplete_expired')).toBe('incomplete_expired')
  })

  it('rejects arbitrary price IDs and open redirect URLs from checkout input', () => {
    expect(checkoutRequestSchema.safeParse({
      role: 'owner',
      billingPeriod: 'monthly',
      priceId: 'attacker-supplied-plan',
    }).success).toBe(false)
    expect(checkoutRequestSchema.safeParse({
      role: 'owner',
      billingPeriod: 'annual',
      customerId: 'attacker-supplied-customer',
    }).success).toBe(false)
    expect(checkoutRequestSchema.safeParse({
      role: 'owner',
      billingPeriod: 'weekly',
    }).success).toBe(false)
    expect(checkoutRequestSchema.safeParse({ role: 'cleaner', billingPeriod: 'annual' }).success).toBe(true)
  })

  it('prevents duplicate active provider subscriptions', () => {
    const active = {
      status: 'active',
      stripeSubscriptionId: 'provider-subscription',
    } as Subscription
    expect(blocksNewProviderCheckout(active)).toBe(true)
    expect(blocksNewProviderCheckout({
      ...active,
      status: 'past_due',
    })).toBe(true)
    expect(blocksNewProviderCheckout({
      ...active,
      status: 'incomplete',
    })).toBe(true)
    expect(blocksNewProviderCheckout({
      ...active,
      status: 'incomplete_expired',
    })).toBe(false)
    expect(blocksNewProviderCheckout({
      ...active,
      stripeSubscriptionId: 'sub_demo_local',
    })).toBe(true)
  })

  it('validates explicit billing modes and fails Stripe mode safely when incomplete', () => {
    expect(parseBillingMode('mock')).toBe('mock')
    expect(parseBillingMode('stripe')).toBe('stripe')
    expect(() => parseBillingMode('automatic')).toThrow()
    expect(resolveBillingMode(undefined, false)).toBe('mock')
    expect(resolveBillingMode(undefined, true)).toBe('stripe')
    expect(resolveBillingMode('stripe', false)).toBe('stripe')
    expect(() => validateStripeServerConfiguration('stripe', {
      secretKey: '',
      ownerMonthlyPriceId: '', ownerAnnualPriceId: '',
      cleanerMonthlyPriceId: '', cleanerAnnualPriceId: '',
    })).toThrow('incomplete')
    expect(() => validateStripeServerConfiguration('mock', {
      secretKey: '',
      ownerMonthlyPriceId: '', ownerAnnualPriceId: '',
      cleanerMonthlyPriceId: '', cleanerAnnualPriceId: '',
    })).not.toThrow()
  })

  it('keeps Stripe credentials outside public Nuxt runtime configuration', () => {
    const source = readFileSync('nuxt.config.ts', 'utf8')
    const publicConfig = source
      .split('public: {')[1]
      ?.split('compatibilityDate:')[0] ?? ''
    expect(publicConfig).not.toContain('stripeSecretKey')
    expect(publicConfig).not.toContain('stripeWebhookSecret')
    expect(publicConfig).not.toContain('stripeOwnerMonthlyPriceId')
    expect(publicConfig).not.toContain('stripeOwnerAnnualPriceId')
    expect(publicConfig).not.toContain('stripeCleanerMonthlyPriceId')
    expect(publicConfig).not.toContain('stripeCleanerAnnualPriceId')
    expect(publicConfig).not.toContain('authSessionSecret')
  })

  it('fails closed without a webhook secret and emits only a safe warning', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    expect(() => requireWebhookSecret('')).toThrow()
    expect(warning).toHaveBeenCalledWith(
      '[billing] Stripe webhook is unavailable because its signing secret is not configured.',
    )
    expect(requireWebhookSecret('configured-in-test')).toBe('configured-in-test')
    warning.mockRestore()
  })

  it('rejects invalid webhook signatures and accepts a verified mocked event', () => {
    const verified = {
      id: 'verified-event',
      type: 'customer.subscription.updated',
    } as Stripe.Event
    const constructEvent = vi.fn()
      .mockImplementationOnce(() => {
        throw new Error('Invalid signature')
      })
      .mockReturnValueOnce(verified)
    const stripe = { webhooks: { constructEvent } } as unknown as Stripe

    expect(() => verifyStripeWebhookEvent(
      stripe,
      'raw-body',
      'invalid-signature',
      'configured-in-test',
    )).toThrow('Invalid signature')
    expect(verifyStripeWebhookEvent(
      stripe,
      'raw-body',
      'valid-signature',
      'configured-in-test',
    )).toBe(verified)
  })

  it('claims and completes each verified event only once', async () => {
    const database = new MockDatabase()
    database.reset()
    const events = new MockStripeEventRepository(database)
    expect(await events.tryClaim('evt_unique')).toBe(true)
    expect(await events.tryClaim('evt_unique')).toBe(false)
    await events.complete('evt_unique')
    expect(await events.isProcessed('evt_unique')).toBe(true)
    expect(await events.tryClaim('evt_unique')).toBe(false)
  })

  it('processes subscription, checkout, invoice success, and invoice failure events', async () => {
    const processed = new Set<string>()
    const events = {
      isProcessed: vi.fn(async (id: string) => processed.has(id)),
      tryClaim: vi.fn(async (id: string) => !processed.has(id)),
      complete: vi.fn(async (id: string) => { processed.add(id) }),
      release: vi.fn(async () => undefined),
    }
    const billing = {
      events: vi.fn(() => events),
      syncSubscription: vi.fn(),
      recordInvoice: vi.fn()
        .mockResolvedValueOnce('sub_paid')
        .mockResolvedValueOnce('sub_failed'),
      syncPaymentMethod: vi.fn(),
    } as unknown as StripeBillingService
    const retrieve = vi.fn(async (id: string) => ({
      id,
      status: id === 'sub_failed' ? 'past_due' : 'active',
    }))
    const stripe = {
      subscriptions: { retrieve },
    } as unknown as Stripe

    await processVerifiedStripeEvent({
      id: 'evt_subscription',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_updated' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(retrieve).toHaveBeenCalledWith('sub_updated')
    expect(billing.syncSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sub_updated', status: 'active' }),
      undefined,
      expect.any(String),
    )

    await processVerifiedStripeEvent({
      id: 'evt_deleted',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_deleted' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(retrieve).toHaveBeenCalledWith('sub_deleted')
    expect(billing.syncSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sub_deleted', status: 'active' }),
      undefined,
      expect.any(String),
    )

    await processVerifiedStripeEvent({
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      data: {
        object: {
          subscription: 'sub_checkout',
          client_reference_id: 'owner-user-01',
        },
      },
    } as unknown as Stripe.Event, billing, stripe)
    expect(retrieve).toHaveBeenCalledWith('sub_checkout')

    await processVerifiedStripeEvent({
      id: 'evt_paid',
      type: 'invoice.paid',
      data: { object: { id: 'in_paid' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(billing.recordInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'in_paid' }),
      'paid',
      expect.any(String),
    )
    expect(retrieve).toHaveBeenCalledWith('sub_paid')
    expect(billing.syncSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sub_paid', status: 'active' }),
      undefined,
      expect.any(String),
    )

    await processVerifiedStripeEvent({
      id: 'evt_failed',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_failed' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(billing.recordInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'in_failed' }),
      'payment_failed',
      expect.any(String),
    )
    expect(retrieve).toHaveBeenCalledWith('sub_failed')
    expect(billing.syncSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sub_failed', status: 'past_due' }),
      undefined,
      expect.any(String),
    )

    const duplicate = await processVerifiedStripeEvent({
      id: 'evt_failed',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_failed' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(duplicate.duplicate).toBe(true)
  })

  it('keeps a subscription trialing after the initial zero-value paid invoice', async () => {
    let localStatus = 'trial'
    const events = {
      isProcessed: vi.fn(async () => false),
      tryClaim: vi.fn(async () => true),
      complete: vi.fn(async () => undefined),
      release: vi.fn(async () => undefined),
    }
    const billing = {
      events: vi.fn(() => events),
      recordInvoice: vi.fn().mockResolvedValue('sub_trial'),
      syncSubscription: vi.fn(async (subscription: Stripe.Subscription) => {
        localStatus = statusFromStripe(subscription.status)
      }),
    } as unknown as StripeBillingService
    const stripe = {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_trial',
          status: 'trialing',
        }),
      },
    } as unknown as Stripe

    await processVerifiedStripeEvent({
      id: 'evt_trial_invoice',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_trial_zero',
          amount_paid: 0,
          parent: {
            type: 'subscription_details',
            subscription_details: { subscription: 'sub_trial' },
          },
        },
      },
    } as unknown as Stripe.Event, billing, stripe)

    expect(localStatus).toBe('trial')
    expect(billing.recordInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ amount_paid: 0 }),
      'paid',
      expect.any(String),
    )
  })

  it('uses the Stripe subscription as lifecycle authority after trial payment events', async () => {
    let localStatus = 'trial'
    let gracePeriodEndsAt: string | null = null
    const events = {
      isProcessed: vi.fn(async () => false),
      tryClaim: vi.fn(async () => true),
      complete: vi.fn(async () => undefined),
      release: vi.fn(async () => undefined),
    }
    const billing = {
      events: vi.fn(() => events),
      recordInvoice: vi.fn(async (_invoice: Stripe.Invoice, type: 'paid' | 'payment_failed') => {
        const patch = invoicePaymentPatch(type, '2026-08-01T00:00:00.000Z')
        gracePeriodEndsAt = patch.grace_period_ends_at
        return 'sub_provider'
      }),
      syncSubscription: vi.fn(async (subscription: Stripe.Subscription) => {
        localStatus = statusFromStripe(subscription.status)
      }),
    } as unknown as StripeBillingService
    const retrieve = vi.fn()
      .mockResolvedValueOnce({ id: 'sub_provider', status: 'active' })
      .mockResolvedValueOnce({ id: 'sub_provider', status: 'past_due' })
    const stripe = { subscriptions: { retrieve } } as unknown as Stripe

    await processVerifiedStripeEvent({
      id: 'evt_post_trial_paid',
      type: 'invoice.paid',
      data: { object: { id: 'in_paid' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(localStatus).toBe('active')
    expect(gracePeriodEndsAt).toBeNull()

    await processVerifiedStripeEvent({
      id: 'evt_post_trial_failed',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_failed' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(localStatus).toBe('past_due')
    expect(gracePeriodEndsAt).toBe('2026-08-04T00:00:00.000Z')
    expect(canUseSubscriptionCapability('owner', {
      status: localStatus,
      stripeSubscriptionId: 'sub_provider',
      gracePeriodEndsAt,
    } as Subscription, 'publish_jobs', new Date('2026-08-02T00:00:00.000Z'), true)).toBe(true)
    expect(canUseSubscriptionCapability('owner', {
      status: localStatus,
      stripeSubscriptionId: 'sub_provider',
      gracePeriodEndsAt,
    } as Subscription, 'publish_jobs', new Date('2026-08-05T00:00:00.000Z'), true)).toBe(false)
  })

  it('ignores older lifecycle projections and throttles billing reconciliation', () => {
    expect(isOlderStripeEvent(
      '2026-08-01T10:00:00.000Z',
      '2026-08-01T09:59:59.000Z',
    )).toBe(true)
    expect(isOlderStripeEvent(
      '2026-08-01T10:00:00.000Z',
      '2026-08-01T10:00:01.000Z',
    )).toBe(false)
    const subscription = {
      stripeSubscriptionId: 'sub_provider',
      updatedAt: '2026-08-01T10:00:00.000Z',
    } as Subscription
    expect(shouldReconcileSubscription(
      subscription,
      new Date('2026-08-01T10:04:59.000Z'),
    )).toBe(false)
    expect(shouldReconcileSubscription(
      subscription,
      new Date('2026-08-01T10:05:00.000Z'),
    )).toBe(true)
  })

  it('extracts current Stripe invoice subscription IDs without legacy fields', () => {
    expect(stripeSubscriptionIdFromInvoice({
      parent: {
        type: 'subscription_details',
        quote_details: null,
        subscription_details: {
          metadata: null,
          subscription: 'sub_invoice',
        },
      },
    } as Stripe.Invoice)).toBe('sub_invoice')
    expect(stripeSubscriptionIdFromInvoice({ parent: null } as Stripe.Invoice)).toBeNull()
  })

  it('denies Premium access for local or abandoned Checkout records without a provider subscription', () => {
    const localTrial = {
      status: 'trial',
      trialEndsAt: '2026-08-08T00:00:00.000Z',
      stripeSubscriptionId: null,
    } as Subscription
    const abandonedCheckout = {
      status: 'incomplete',
      stripeCustomerId: 'cus_abandoned',
      stripeSubscriptionId: null,
    } as Subscription
    const now = new Date('2026-08-01T00:00:00.000Z')
    expect(hasActiveSubscription(localTrial, now, true)).toBe(false)
    expect(hasActiveSubscription(abandonedCheckout, now, true)).toBe(false)
    expect(canUseSubscriptionCapability(
      'cleaner',
      localTrial,
      'submit_offers',
      now,
      true,
    )).toBe(false)
    expect(hasActiveSubscription({
      status: 'active',
      stripeSubscriptionId: 'sub_provider',
      currentPeriodEndsAt: '2026-08-02T00:00:00.000Z',
    } as Subscription, now, true)).toBe(true)
    expect(hasActiveSubscription({
      status: 'active',
      stripeSubscriptionId: 'sub_provider',
      currentPeriodEndsAt: '2026-07-31T00:00:00.000Z',
    } as Subscription, now, true)).toBe(false)
    expect(hasActiveSubscription({
      status: 'active',
      stripeSubscriptionId: 'sub_provider',
      currentPeriodEndsAt: null,
    } as Subscription, now, true)).toBe(false)
  })

  it('keeps free registration and Premium billing redirects declared on their existing routes', () => {
    const registrationPage = readFileSync('pages/registracija.vue', 'utf8')
    const ownerPublishPage = readFileSync('pages/dashboard/poslovi/novi.vue', 'utf8')
    const cleanerOfferPage = readFileSync('pages/dashboard-cleaner/poslovi/[id]/ponuda.vue', 'utf8')
    const subscriptionMiddleware = readFileSync('middleware/subscription.ts', 'utf8')

    expect(registrationPage).not.toContain("middleware: ['subscription']")
    expect(ownerPublishPage).toContain("subscriptionCapability: 'publish_jobs'")
    expect(cleanerOfferPage).toContain("subscriptionCapability: 'submit_offers'")
    expect(subscriptionMiddleware).toContain("auth.user.role === 'owner' ? 'ownerBilling' : 'cleanerBilling'")
  })
})

describe('Phase 7 subscription action security', () => {
  const database = new MockDatabase()
  const offers = new MockOfferRepository(database)
  const jobs = new MockJobRepository(database)

  beforeEach(() => database.reset())

  it('blocks an inactive owner from accepting an offer', async () => {
    const offerId = database.transaction((snapshot) => {
      const offer = snapshot.offers.find((item) => item.status === 'pending')!
      const job = snapshot.jobs.find((item) => item.id === offer.jobId)!
      const subscription = snapshot.subscriptions.find((item) => item.userId === job.ownerId)!
      subscription.status = 'expired'
      return offer.id
    })
    const offer = await offers.getById(offerId)
    const job = database.read().jobs.find((item) => item.id === offer!.jobId)!
    await expect(offers.accept(offerId, job.ownerId))
      .rejects.toMatchObject({ code: 'subscription_required' })
  })

  it('blocks an inactive cleaner from editing an offer or confirming a new job', async () => {
    const fixture = database.transaction((snapshot) => {
      const offer = snapshot.offers.find((item) => item.status === 'pending')!
      const cleanerSubscription = snapshot.subscriptions.find(
        (item) => item.userId === offer.cleanerId,
      )!
      cleanerSubscription.status = 'expired'
      const assignedJob = snapshot.jobs.find((item) => item.status === 'assigned')!
      assignedJob.assignedCleanerId = offer.cleanerId
      return { offerId: offer.id, cleanerId: offer.cleanerId, jobId: assignedJob.id }
    })
    await expect(offers.update({
      id: fixture.offerId,
      proposedPrice: 75,
    }, fixture.cleanerId)).rejects.toMatchObject({ code: 'subscription_required' })
    await expect(jobs.progress(
      fixture.jobId,
      fixture.cleanerId,
      'cleaner_confirmed',
    )).rejects.toMatchObject({ code: 'subscription_required' })
  })
})

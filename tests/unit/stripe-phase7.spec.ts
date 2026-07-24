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
  getBillingCheckoutAction,
  type PublicBillingPlan,
} from '~/services/billing/billingPresentation'
import {
  parseBillingMode,
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
  hasActiveProviderSubscription,
  statusFromStripe,
  subscriptionPatchFromStripe,
} from '~/server/services/StripeBillingService'
import type { StripeBillingService } from '~/server/services/StripeBillingService'

const checkoutRequest = {
  userId: 'owner-user-01',
  plan: 'owner' as const,
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
      owner: 'price_owner_from_env',
      cleaner: 'price_cleaner_from_env',
    })

    await gateway.createCheckout(checkoutRequest)
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
      line_items: [{ price: 'price_owner_from_env', quantity: 1 }],
      subscription_data: expect.objectContaining({ trial_period_days: 7 }),
    }))

    await gateway.createCheckout({
      ...checkoutRequest,
      userId: 'cleaner-user-01',
      plan: 'cleaner',
    })
    expect(create).toHaveBeenLastCalledWith(expect.objectContaining({
      line_items: [{ price: 'price_cleaner_from_env', quantity: 1 }],
    }))
  })

  it('uses centralized role prices and trial duration for presentation', () => {
    expect(saasConfig.plans.owner.monthlyAmount).toBe(1900)
    expect(saasConfig.plans.cleaner.monthlyAmount).toBe(3900)
    expect(saasConfig.currency).toBe('EUR')
    expect(saasConfig.trialDays).toBe(7)
  })

  it('presents the configured role plan when the API returns no subscription', () => {
    const ownerPlan: PublicBillingPlan = {
      monthlyAmount: 1900,
      currency: 'EUR',
      trialDays: 7,
    }
    const cleanerPlan: PublicBillingPlan = {
      monthlyAmount: 3900,
      currency: 'EUR',
      trialDays: 7,
    }

    expect(createBillingPresentation('owner', null, ownerPlan)).toEqual({
      role: 'owner',
      monthlyAmount: 1900,
      currency: 'EUR',
      includedTrialDays: 7,
      status: 'not_subscribed',
      hasProviderSubscription: false,
    })
    expect(createBillingPresentation('cleaner', null, cleanerPlan)).toMatchObject({
      role: 'cleaner',
      monthlyAmount: 3900,
      includedTrialDays: 7,
      status: 'not_subscribed',
      hasProviderSubscription: false,
    })
  })

  it('presents existing subscription status without replacing public plan pricing', () => {
    const presentation = createBillingPresentation('owner', {
      status: 'active',
      stripeSubscriptionId: 'provider-subscription',
    } as Subscription, {
      monthlyAmount: 1900,
      currency: 'EUR',
      trialDays: 7,
    })

    expect(presentation).toMatchObject({
      monthlyAmount: 1900,
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
          price: { id: 'price_server_selected', unit_amount: 1900 },
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
      cancelAtPeriodEnd: false,
    })
    expect(patch.trialEndsAt).toBe('2024-07-10T09:46:40.000Z')
    expect(statusFromStripe('canceled')).toBe('cancelled')
    expect(statusFromStripe('past_due')).toBe('past_due')
    expect(statusFromStripe('incomplete_expired')).toBe('incomplete_expired')
  })

  it('rejects arbitrary price IDs and open redirect URLs from checkout input', () => {
    expect(checkoutRequestSchema.safeParse({
      successPath: '/dashboard/billing',
      cancelPath: '/dashboard/billing',
      priceId: 'attacker-supplied-plan',
    }).success).toBe(false)
    expect(checkoutRequestSchema.safeParse({
      successPath: '/dashboard/billing',
      cancelPath: '/dashboard/billing',
      customerId: 'attacker-supplied-customer',
    }).success).toBe(false)
    expect(checkoutRequestSchema.safeParse({
      successPath: '//attacker.test',
      cancelPath: '/dashboard/billing',
    }).success).toBe(false)
  })

  it('prevents duplicate active provider subscriptions', () => {
    const active = {
      status: 'active',
      stripeSubscriptionId: 'provider-subscription',
    } as Subscription
    expect(hasActiveProviderSubscription(active)).toBe(true)
    expect(hasActiveProviderSubscription({
      ...active,
      status: 'past_due',
    })).toBe(false)
    expect(hasActiveProviderSubscription({
      ...active,
      stripeSubscriptionId: 'sub_demo_local',
    })).toBe(true)
  })

  it('validates explicit billing modes and fails Stripe mode safely when incomplete', () => {
    expect(parseBillingMode('mock')).toBe('mock')
    expect(parseBillingMode('stripe')).toBe('stripe')
    expect(() => parseBillingMode('automatic')).toThrow()
    expect(() => validateStripeServerConfiguration('stripe', {
      secretKey: '',
      ownerPriceId: '',
      cleanerPriceId: '',
    })).toThrow('incomplete')
    expect(() => validateStripeServerConfiguration('mock', {
      secretKey: '',
      ownerPriceId: '',
      cleanerPriceId: '',
    })).not.toThrow()
  })

  it('keeps Stripe credentials outside public Nuxt runtime configuration', () => {
    const source = readFileSync('nuxt.config.ts', 'utf8')
    const publicConfig = source
      .split('public: {')[1]
      ?.split('compatibilityDate:')[0] ?? ''
    expect(publicConfig).not.toContain('stripeSecretKey')
    expect(publicConfig).not.toContain('stripeWebhookSecret')
    expect(publicConfig).not.toContain('stripeOwnerPriceId')
    expect(publicConfig).not.toContain('stripeCleanerPriceId')
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
      markInvoice: vi.fn(),
      syncPaymentMethod: vi.fn(),
    } as unknown as StripeBillingService
    const retrieve = vi.fn().mockResolvedValue({ id: 'sub_checkout' })
    const stripe = {
      subscriptions: { retrieve },
    } as unknown as Stripe

    await processVerifiedStripeEvent({
      id: 'evt_subscription',
      type: 'customer.subscription.updated',
      data: { object: { id: 'sub_updated' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(billing.syncSubscription).toHaveBeenCalled()

    await processVerifiedStripeEvent({
      id: 'evt_deleted',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_deleted' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(billing.syncSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sub_deleted' }),
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
    expect(billing.markInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'in_paid' }),
      'paid',
      expect.any(String),
    )

    await processVerifiedStripeEvent({
      id: 'evt_failed',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_failed' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(billing.markInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'in_failed' }),
      'payment_failed',
      expect.any(String),
    )

    const duplicate = await processVerifiedStripeEvent({
      id: 'evt_failed',
      type: 'invoice.payment_failed',
      data: { object: { id: 'in_failed' } },
    } as unknown as Stripe.Event, billing, stripe)
    expect(duplicate.duplicate).toBe(true)
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

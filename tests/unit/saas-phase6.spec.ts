import { beforeEach, describe, expect, it } from 'vitest'
import type { Subscription } from '~/domains/subscriptions/types'
import { MockDatabase } from '~/repositories/mock/MockDatabase'
import { MockNotificationRepository } from '~/repositories/mock/MockNotificationRepository'
import { MockRatingRepository } from '~/repositories/mock/MockRatingRepository'
import { MockSubscriptionRepository } from '~/repositories/mock/MockSubscriptionRepository'
import { MockStripeGateway } from '~/services/billing/MockStripeGateway'
import { mapStripeEvent } from '~/services/billing/stripeEventMapper'
import { buildScheduledNotifications } from '~/services/notifications/notificationScheduler'
import {
  canUseSubscriptionCapability,
  effectiveSubscriptionStatus,
  trialRemainingDays,
} from '~/services/subscriptions/subscriptionAccess'

const database = new MockDatabase()
const subscriptions = new MockSubscriptionRepository(database)
const notifications = new MockNotificationRepository(database)
const ratings = new MockRatingRepository(database)

const subscriptionFixture = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'subscription-test',
  isDemo: true,
  createdAt: '2026-07-20T00:00:00.000Z',
  updatedAt: '2026-07-20T00:00:00.000Z',
  userId: 'cleaner-user-test',
  plan: 'cleaner',
  status: 'trial',
  unitAmount: 3900,
  billingPeriod: 'monthly',
  stripeInterval: 'month',
  currency: 'EUR',
  trialStartedAt: '2026-07-20T00:00:00.000Z',
  trialEndsAt: '2026-07-27T00:00:00.000Z',
  trialConsumed: true,
  currentPeriodStartedAt: null,
  currentPeriodEndsAt: null,
  cancelledAt: null,
  cancelAtPeriodEnd: false,
  gracePeriodEndsAt: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  lastSuccessfulPaymentAt: null,
  lastFailedPaymentAt: null,
  ...overrides,
})

describe('Phase 6 SaaS rules', () => {
  beforeEach(() => database.reset())

  it('derives trial, expired, past due, and suspended states deterministically', () => {
    const now = new Date('2026-07-23T00:00:00.000Z')
    const trial = subscriptionFixture()
    expect(effectiveSubscriptionStatus(trial, now)).toBe('trial')
    expect(trialRemainingDays(trial, now)).toBe(4)
    expect(effectiveSubscriptionStatus(trial, new Date('2026-07-28T00:00:00.000Z'))).toBe('expired')
    expect(effectiveSubscriptionStatus(subscriptionFixture({
      status: 'past_due',
      gracePeriodEndsAt: '2026-07-24T00:00:00.000Z',
    }), now)).toBe('past_due')
    expect(effectiveSubscriptionStatus(subscriptionFixture({
      status: 'past_due',
      gracePeriodEndsAt: '2026-07-22T00:00:00.000Z',
    }), now)).toBe('suspended')
  })

  it('enforces role-specific capabilities through one permission service', () => {
    const active = subscriptionFixture({ status: 'active' })
    const expired = subscriptionFixture({ status: 'expired' })
    expect(canUseSubscriptionCapability('owner', active, 'publish_jobs')).toBe(true)
    expect(canUseSubscriptionCapability('owner', active, 'submit_offers')).toBe(false)
    expect(canUseSubscriptionCapability('cleaner', active, 'submit_offers')).toBe(true)
    expect(canUseSubscriptionCapability('cleaner', active, 'view_contact')).toBe(true)
    expect(canUseSubscriptionCapability('cleaner', expired, 'submit_offers')).toBe(false)
  })

  it('creates a trial once and never restarts a consumed trial', async () => {
    const first = await subscriptions.ensureTrial('new-owner', 'owner')
    const second = await subscriptions.ensureTrial('new-owner', 'owner')
    expect(first.id).toBe(second.id)
    expect(first.trialConsumed).toBe(true)
    expect(first.unitAmount).toBe(1900)
  })

  it('runs mock checkout, activates billing, and creates an invoice and payment method', async () => {
    await subscriptions.ensureTrial('new-cleaner', 'cleaner')
    const gateway = new MockStripeGateway()
    const redirect = await gateway.createCheckout({
      userId: 'new-cleaner',
      plan: 'cleaner',
      billingPeriod: 'annual',
      customerId: null,
      successUrl: '/dashboard-cleaner/billing',
      cancelUrl: '/dashboard-cleaner/billing',
      trialDays: 7,
    })
    expect(redirect.url).toContain('checkout=success')
    const active = await subscriptions.activateFromCheckout('new-cleaner', 'cus_test', 'sub_test', 'annual')
    expect(active.status).toBe('active')
    expect(active.billingPeriod).toBe('annual')
    expect(active.stripeInterval).toBe('year')
    expect(active.unitAmount).toBe(19900)
    expect(await subscriptions.listInvoices('new-cleaner')).toHaveLength(1)
    expect(await subscriptions.getPaymentMethod('new-cleaner')).toMatchObject({ last4: '4242' })
    expect(await notifications.listByUser('new-cleaner')).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'subscription_activated' })]),
    )
  })

  it('maps signed Stripe event payloads into idempotent synchronization commands', () => {
    expect(mapStripeEvent({
      id: 'evt_1',
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_1',
          subscription: 'sub_1',
          metadata: { userId: 'owner-user-01' },
        },
      },
    })).toEqual({
      userId: 'owner-user-01',
      eventId: 'evt_1',
      status: 'past_due',
      stripeCustomerId: 'cus_1',
      stripeSubscriptionId: 'sub_1',
    })
  })

  it('creates, edits, summarizes, and deduplicates verified bilateral reviews', async () => {
    database.transaction((snapshot) => {
      const job = snapshot.jobs.find((item) => item.id === 'job-17')!
      job.status = 'completed'
      job.assignedCleanerId = 'cleaner-user-17'
      job.acceptedOfferId = 'offer-17-01'
      snapshot.ratings = snapshot.ratings.filter((item) => item.jobId !== job.id)
    })
    const created = await ratings.create({
      jobId: 'job-17',
      authorId: 'owner-user-02',
      subjectId: 'cleaner-user-17',
      overallScore: 5,
      categoryScores: [
        { category: 'cleaning_quality', score: 5 },
        { category: 'reliability', score: 4 },
        { category: 'communication', score: 5 },
        { category: 'punctuality', score: 5 },
      ],
      comment: 'Pouzdana i uredna demo suradnja.',
    })
    expect(created.verifiedCompletedJob).toBe(true)
    expect(await ratings.update({
      id: created.id,
      overallScore: 4,
      categoryScores: created.categoryScores,
      comment: 'Ažurirana provjerena ocjena.',
    }, created.authorId)).toMatchObject({ overallScore: 4 })
    expect(await ratings.summaryForUser(created.subjectId)).toMatchObject({ average: 4, count: 1 })
    await expect(ratings.create({
      jobId: created.jobId,
      authorId: created.authorId,
      subjectId: created.subjectId,
      overallScore: 5,
      categoryScores: created.categoryScores,
      comment: '',
    })).rejects.toMatchObject({ code: 'rating_already_exists' })
  })

  it('supports unread, read, archive, and scheduled notification flows', async () => {
    const created = await notifications.create('owner-user-01', 'job_published', 'job-01')
    expect(created.readAt).toBeNull()
    expect(await notifications.markAsRead(created.id, created.userId)).toMatchObject({
      id: created.id,
      readAt: expect.any(String),
    })
    await notifications.archive(created.id, created.userId)
    expect((await notifications.listByUser(created.userId)).some((item) => item.id === created.id)).toBe(false)

    const scheduled = buildScheduledNotifications([
      subscriptionFixture({ trialEndsAt: '2026-07-24T00:00:00.000Z' }),
    ], [], new Date('2026-07-23T00:00:00.000Z'))
    expect(scheduled).toEqual([
      expect.objectContaining({ type: 'trial_ending' }),
    ])
  })
})

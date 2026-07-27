import adminsData from '~/data/mock/admins.json'
import activitiesData from '~/data/mock/activities.json'
import citiesData from '~/data/mock/cities.json'
import cleanersData from '~/data/mock/cleaners.json'
import credentialsData from '~/data/mock/credentials.json'
import jobsData from '~/data/mock/jobs.json'
import invoicesData from '~/data/mock/invoices.json'
import notificationsData from '~/data/mock/notifications.json'
import offersData from '~/data/mock/offers.json'
import ownersData from '~/data/mock/owners.json'
import paymentMethodsData from '~/data/mock/payment-methods.json'
import ratingsData from '~/data/mock/ratings.json'
import subscriptionsData from '~/data/mock/subscriptions.json'
import usersData from '~/data/mock/users.json'
import { saasConfig } from '~/config/saas'
import type { AuthSession } from '~/domains/auth/types'
import type { CleaningJob, JobActivity } from '~/domains/jobs/types'
import type { Notification } from '~/domains/notifications/types'
import type { JobOffer } from '~/domains/offers/types'
import type { Rating } from '~/domains/ratings/types'
import type { City, DemoEntity } from '~/domains/shared/types'
import type { BillingInvoice, PaymentMethod, Subscription } from '~/domains/subscriptions/types'
import type {
  AdminProfile,
  CleanerProfile,
  OwnerProfile,
  User,
} from '~/domains/users/types'

export interface MockCredential extends DemoEntity {
  userId: string
  email: string
  password: string
}

export interface MockDatabaseSnapshot {
  users: User[]
  credentials: MockCredential[]
  owners: OwnerProfile[]
  cleaners: CleanerProfile[]
  admins: AdminProfile[]
  cities: City[]
  jobs: CleaningJob[]
  offers: JobOffer[]
  ratings: Rating[]
  subscriptions: Subscription[]
  invoices: BillingInvoice[]
  paymentMethods: PaymentMethod[]
  notifications: Notification[]
  activities: JobActivity[]
  processedStripeEventIds: string[]
}

const databaseStorageKey = 'clean_marketplace_mock_database'
const sessionStorageKey = 'clean_marketplace_auth_session'

const rawSeedSnapshot = {
  users: usersData,
  credentials: credentialsData,
  owners: ownersData,
  cleaners: cleanersData,
  admins: adminsData,
  cities: citiesData,
  jobs: jobsData,
  offers: offersData,
  ratings: ratingsData,
  subscriptions: subscriptionsData,
  invoices: invoicesData,
  paymentMethods: paymentMethodsData,
  notifications: notificationsData,
  activities: activitiesData,
  processedStripeEventIds: [],
} as unknown as MockDatabaseSnapshot

const migrateSnapshot = (source: MockDatabaseSnapshot): MockDatabaseSnapshot => {
  const snapshot = structuredClone(source)
  snapshot.activities ??= []
  snapshot.processedStripeEventIds ??= []
  snapshot.invoices ??= []
  snapshot.paymentMethods ??= []
  snapshot.notifications = (snapshot.notifications ?? []).map((notification) => ({
    ...notification,
    archivedAt: notification.archivedAt ?? null,
  }))
  snapshot.cleaners = (snapshot.cleaners ?? []).map((cleaner) => ({
    ...cleaner,
    onboardingCompleted: cleaner.onboardingCompleted ?? true,
  }))
  snapshot.subscriptions = (snapshot.subscriptions ?? []).map((subscription) => {
    const legacy = subscription as Subscription & {
      cleanerId?: string
      priceMonthly?: number
    }
    const userId = subscription.userId ?? legacy.cleanerId ?? ''
    return {
      ...subscription,
      userId,
      plan: subscription.plan ?? (userId.startsWith('owner') ? 'owner' : 'cleaner'),
      unitAmount: subscription.unitAmount ?? (legacy.priceMonthly ?? 39) * 100,
      billingPeriod: subscription.billingPeriod ?? 'monthly',
      stripeInterval: subscription.stripeInterval ?? 'month',
      trialConsumed: subscription.trialConsumed ?? Boolean(subscription.trialStartedAt),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
      gracePeriodEndsAt: subscription.gracePeriodEndsAt ?? null,
      stripeCustomerId: subscription.stripeCustomerId ?? null,
      stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
      stripePriceId: subscription.stripePriceId ?? null,
      lastSuccessfulPaymentAt: subscription.lastSuccessfulPaymentAt ?? null,
      lastFailedPaymentAt: subscription.lastFailedPaymentAt ?? null,
    }
  })
  for (const owner of snapshot.owners) {
    if (snapshot.subscriptions.some((subscription) => subscription.userId === owner.userId)) continue
    snapshot.subscriptions.push({
      id: `subscription-${owner.userId}`,
      isDemo: true,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
      userId: owner.userId,
      plan: 'owner',
      status: 'active',
      unitAmount: saasConfig.plans.owner.monthlyAmount,
      billingPeriod: 'monthly',
      stripeInterval: 'month',
      currency: saasConfig.currency,
      trialStartedAt: null,
      trialEndsAt: null,
      trialConsumed: true,
      currentPeriodStartedAt: '2026-07-01T00:00:00.000Z',
      currentPeriodEndsAt: '2026-08-01T00:00:00.000Z',
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      gracePeriodEndsAt: null,
      stripeCustomerId: `cus_demo_${owner.userId}`,
      stripeSubscriptionId: `sub_demo_${owner.userId}`,
      stripePriceId: null,
      lastSuccessfulPaymentAt: null,
      lastFailedPaymentAt: null,
    })
  }
  snapshot.ratings = (snapshot.ratings ?? []).map((rating) => ({
    ...rating,
    categoryScores: rating.categoryScores.map((item) => ({
      ...item,
      category: (item.category as string) === 'description_accuracy'
        ? 'accuracy'
        : (item.category as string) === 'organization'
            ? 'payment_experience'
            : item.category,
    })),
    verifiedCompletedJob: true,
    editableUntil: rating.editableUntil
      ?? new Date(new Date(rating.createdAt).getTime() + 14 * 86_400_000).toISOString(),
  }))
  return snapshot
}

const seedSnapshot = migrateSnapshot(rawSeedSnapshot)
let serverSnapshot = structuredClone(seedSnapshot)

const isSnapshot = (value: unknown): value is MockDatabaseSnapshot => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const snapshot = value as Partial<MockDatabaseSnapshot>
  return Array.isArray(snapshot.users)
    && Array.isArray(snapshot.owners)
    && Array.isArray(snapshot.cleaners)
    && Array.isArray(snapshot.jobs)
    && Array.isArray(snapshot.offers)
}

export class MockDatabase {
  read(): MockDatabaseSnapshot {
    if (!import.meta.client) {
      return migrateSnapshot(serverSnapshot)
    }

    const storedValue = localStorage.getItem(databaseStorageKey)
    if (!storedValue) {
      return structuredClone(seedSnapshot)
    }

    try {
      const parsedValue: unknown = JSON.parse(storedValue)
      return isSnapshot(parsedValue)
        ? migrateSnapshot({
            ...parsedValue,
            activities: Array.isArray(parsedValue.activities) ? parsedValue.activities : [],
            invoices: Array.isArray(parsedValue.invoices) ? parsedValue.invoices : [],
            paymentMethods: Array.isArray(parsedValue.paymentMethods) ? parsedValue.paymentMethods : [],
          } as MockDatabaseSnapshot)
        : structuredClone(seedSnapshot)
    }
    catch {
      return structuredClone(seedSnapshot)
    }
  }

  write(snapshot: MockDatabaseSnapshot): void {
    const clonedSnapshot = structuredClone(snapshot)
    if (import.meta.client) {
      localStorage.setItem(databaseStorageKey, JSON.stringify(clonedSnapshot))
    }
    else {
      serverSnapshot = clonedSnapshot
    }
  }

  transaction<TResult>(
    operation: (snapshot: MockDatabaseSnapshot) => TResult,
  ): TResult {
    const snapshot = this.read()
    const result = operation(snapshot)
    this.write(snapshot)
    return structuredClone(result)
  }

  reset(): void {
    if (import.meta.client) {
      localStorage.removeItem(databaseStorageKey)
      localStorage.removeItem(sessionStorageKey)
    }
    else {
      serverSnapshot = structuredClone(seedSnapshot)
    }
  }

  readSession(): AuthSession | null {
    if (!import.meta.client) {
      return null
    }

    const storedSession = localStorage.getItem(sessionStorageKey)
    if (!storedSession) {
      return null
    }

    try {
      const parsedSession = JSON.parse(storedSession) as Partial<AuthSession>
      return typeof parsedSession.id === 'string'
        && typeof parsedSession.userId === 'string'
        && typeof parsedSession.expiresAt === 'string'
        ? parsedSession as AuthSession
        : null
    }
    catch {
      return null
    }
  }

  writeSession(session: AuthSession | null): void {
    if (!import.meta.client) {
      return
    }

    if (session) {
      localStorage.setItem(sessionStorageKey, JSON.stringify(session))
    }
    else {
      localStorage.removeItem(sessionStorageKey)
    }
  }
}

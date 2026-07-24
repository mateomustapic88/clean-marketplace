import { DomainError } from '~/domains/shared/errors'
import type {
  AuthErrorCode,
  AuthResult,
  AuthSession,
  LoginCredentials,
  RegisterInput,
  RegistrationResult,
} from '~/domains/auth/types'
import type {
  CleanerProfile,
  OwnerProfile,
  User,
} from '~/domains/users/types'
import type { Subscription } from '~/domains/subscriptions/types'
import type { AuthRepository } from '~/repositories/auth/AuthRepository'
import type { MockDatabase } from '~/repositories/mock/MockDatabase'
import { createId, nowIso } from '~/repositories/mock/helpers'
import { createNotification } from '~/services/notifications/notificationFactory'
import { createTrialDates } from '~/services/subscriptions/subscriptionAccess'
import { saasConfig } from '~/config/saas'

export class MockAuthRepository implements AuthRepository {
  constructor(private readonly database: MockDatabase) {}

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const normalizedEmail = credentials.email.trim().toLowerCase()
    const snapshot = this.database.read()
    const credential = snapshot.credentials.find(
      (item) => item.email.toLowerCase() === normalizedEmail
        && item.password === credentials.password,
    )

    if (!credential) {
      throw new DomainError<AuthErrorCode>('invalid_credentials')
    }

    const user = snapshot.users.find((item) => item.id === credential.userId)
    if (!user) {
      throw new DomainError<AuthErrorCode>('invalid_credentials')
    }
    if (user.status === 'suspended') {
      throw new DomainError<AuthErrorCode>('user_suspended')
    }

    const session = this.createSession(user.id, user.isDemo)
    this.database.writeSession(session)
    return {
      session,
      user: structuredClone(user),
    }
  }

  async register(input: RegisterInput): Promise<RegistrationResult> {
    const normalizedEmail = input.email.trim().toLowerCase()
    const timestamp = nowIso()

    const result = this.database.transaction((snapshot) => {
      const emailExists = snapshot.users.some(
        (user) => user.email.toLowerCase() === normalizedEmail,
      )
      if (emailExists) {
        throw new DomainError<AuthErrorCode>('email_exists')
      }

      const userId = createId(`${input.role}-user`)
      const user: User = {
        id: userId,
        isDemo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        email: normalizedEmail,
        displayName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        role: input.role,
        status: 'active',
        avatarSeed: userId,
      }

      snapshot.users.push(user)
      snapshot.credentials.push({
        id: createId('credential'),
        isDemo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId,
        email: normalizedEmail,
        password: input.password,
      })

      if (input.role === 'owner') {
        const profile: OwnerProfile = {
          id: createId('owner'),
          isDemo: true,
          createdAt: timestamp,
          updatedAt: timestamp,
          userId,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: input.phone.trim(),
          cityCode: input.cityCode,
          preferredContactMethod: 'email',
          companyName: null,
          agencyName: null,
          notificationPreferences: {
            email: true,
            inApp: true,
            jobUpdates: true,
            offers: true,
            marketing: false,
          },
          preferredLanguage: 'hr',
          timeZone: 'Europe/Zagreb',
          avatarUrl: null,
          onboardingCompleted: false,
          apartmentName: null,
          apartmentCityCode: null,
          apartmentAddress: null,
          averageRating: null,
          ratingCount: 0,
        }
        snapshot.owners.push(profile)
      }
      else {
        const profile: CleanerProfile = {
          id: createId('cleaner'),
          isDemo: true,
          createdAt: timestamp,
          updatedAt: timestamp,
          userId,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          phone: input.phone.trim(),
          cityCode: input.cityCode,
          hourlyRate: 15,
          minimumJobPrice: 35,
          serviceRadiusKm: 20,
          serviceAreas: [{ cityCode: input.cityCode, radiusKm: 20 }],
          availability: Array.from({ length: 7 }, (_, weekday) => ({
            weekday,
            enabled: weekday > 0 && weekday < 6,
            ranges: weekday > 0 && weekday < 6
              ? [{ start: '09:00', end: '17:00' }]
              : [],
          })),
          yearsOfExperience: 0,
          biography: '',
          companyName: null,
          oib: null,
          website: null,
          languages: ['hr'],
          ownTransportation: false,
          bringsSupplies: false,
          sameDayAvailable: false,
          weekendAvailable: false,
          averageRating: null,
          ratingCount: 0,
          completedJobs: 0,
          favouriteJobIds: [],
          vacationMode: false,
          avatarUrl: null,
          onboardingCompleted: false,
        }
        snapshot.cleaners.push(profile)
      }

      const trial = createTrialDates(new Date(timestamp))
      const subscription: Subscription = {
        id: createId('subscription'),
        isDemo: true,
        createdAt: timestamp,
        updatedAt: timestamp,
        userId,
        plan: input.role,
        status: 'trial',
        unitAmount: saasConfig.plans[input.role].monthlyAmount,
        currency: saasConfig.currency,
        trialStartedAt: trial.startedAt,
        trialEndsAt: trial.endsAt,
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
      }
      snapshot.subscriptions.push(subscription)
      snapshot.notifications.push(createNotification(userId, 'trial_ending', null))

      const session = this.createSession(user.id, true)
      return { user, session }
    })

    this.database.writeSession(result.session)
    return { auth: result, confirmationRequired: false }
  }

  async logout(): Promise<void> {
    this.database.writeSession(null)
  }

  async restoreSession(): Promise<AuthResult | null> {
    const session = this.database.readSession()
    if (!session) {
      return null
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.database.writeSession(null)
      return null
    }

    const user = this.database.read().users.find(
      (item) => item.id === session.userId,
    )
    if (!user || user.status !== 'active') {
      this.database.writeSession(null)
      return null
    }

    return {
      session: structuredClone(session),
      user: structuredClone(user),
    }
  }

  async requestPasswordReset(_email: string): Promise<void> {
    await Promise.resolve()
  }

  async updatePassword(_password: string): Promise<void> {
    await Promise.resolve()
  }

  private createSession(userId: string, isDemo: boolean): AuthSession {
    const createdAt = new Date()
    const expiresAt = new Date(createdAt)
    expiresAt.setDate(expiresAt.getDate() + 7)

    return {
      id: createId('session'),
      userId,
      isDemo,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    }
  }
}

import type { CleaningJob, CleaningJobServices, JobActivity } from '~/domains/jobs/types'
import type { Notification } from '~/domains/notifications/types'
import type { JobOffer } from '~/domains/offers/types'
import type { Rating, RatingCategoryScore } from '~/domains/ratings/types'
import type { BillingInvoice, PaymentMethod, Subscription } from '~/domains/subscriptions/types'

export type DbRow = Record<string, unknown>

const rows = (value: unknown): DbRow[] => Array.isArray(value) ? value as DbRow[] : []
const row = (value: unknown): DbRow | null => {
  if (Array.isArray(value)) return value[0] as DbRow | undefined ?? null
  return value && typeof value === 'object' ? value as DbRow : null
}
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const nullableText = (value: unknown) => typeof value === 'string' ? value : null
const number = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback
const bool = (value: unknown) => value === true

export const mapJob = (record: DbRow): CleaningJob => {
  const services = row(record.job_services)
  const location = row(record.job_private_locations)
  const images = rows(record.job_images)
  return {
    id: text(record.id),
    ownerId: text(record.owner_id),
    assignedCleanerId: nullableText(record.assigned_cleaner_id),
    acceptedOfferId: nullableText(record.accepted_offer_id),
    title: text(record.title),
    apartmentName: text(record.apartment_name),
    cityCode: text(record.city_code),
    approximateArea: text(record.approximate_area),
    address: text(location?.exact_address, text(record.approximate_area)),
    hideExactAddress: bool(record.hide_exact_address),
    sizeSquareMeters: number(record.size_square_meters),
    bedrooms: number(record.bedrooms),
    bathrooms: number(record.bathrooms),
    beds: number(record.beds),
    guestCapacity: number(record.guest_capacity),
    estimatedDurationHours: number(record.estimated_duration_hours),
    preferredDate: text(record.preferred_date),
    preferredStartTime: text(record.preferred_start_time).slice(0, 5),
    flexibleTime: bool(record.flexible_time),
    proposedBudget: number(record.proposed_budget_cents) / 100,
    budgetType: record.budget_type as CleaningJob['budgetType'],
    services: mapServices(services),
    additionalInstructions: text(record.additional_instructions),
    photoUrls: images.map((image) => text(image.signed_url, text(image.storage_path))),
    offerDeadline: text(record.offer_deadline),
    status: record.status as CleaningJob['status'],
    offerCount: number(record.offer_count),
    isUrgent: bool(record.is_urgent),
    isDemo: bool(record.is_demo),
    createdAt: text(record.created_at),
    updatedAt: text(record.updated_at),
  }
}

const mapServices = (record: DbRow | null): CleaningJobServices => ({
  cleaningSuppliesProvided: bool(record?.cleaning_supplies_provided),
  linenReplacement: bool(record?.linen_replacement),
  towelReplacement: bool(record?.towel_replacement),
  laundry: bool(record?.laundry),
  balconyCleaning: bool(record?.balcony_cleaning),
  fridgeCleaning: bool(record?.fridge_cleaning),
  ovenCleaning: bool(record?.oven_cleaning),
  kitchenCleaning: bool(record?.kitchen_cleaning),
  windowCleaning: bool(record?.window_cleaning),
  sameDayTurnover: bool(record?.same_day_turnover),
})

export const mapActivity = (record: DbRow): JobActivity => ({
  id: text(record.id),
  jobId: text(record.job_id),
  actorUserId: nullableText(record.actor_user_id),
  type: record.type as JobActivity['type'],
  occurredAt: text(record.occurred_at),
  ...(row(record.metadata) && { metadata: row(record.metadata) as Record<string, string | number> }),
  isDemo: bool(record.is_demo) as true,
})

export const mapOffer = (record: DbRow): JobOffer => ({
  id: text(record.id),
  jobId: text(record.job_id),
  cleanerId: text(record.cleaner_id),
  proposedPrice: number(record.proposed_price_cents) / 100,
  priceType: record.price_type as JobOffer['priceType'],
  estimatedDurationHours: number(record.estimated_duration_hours),
  availableArrivalTime: text(record.available_arrival_time),
  message: text(record.message),
  suppliesIncluded: bool(record.supplies_included),
  expiresAt: text(record.expires_at),
  status: record.status as JobOffer['status'],
  isDemo: bool(record.is_demo),
  createdAt: text(record.created_at),
  updatedAt: text(record.updated_at),
})

export const mapRating = (record: DbRow): Rating => ({
  id: text(record.id),
  jobId: text(record.job_id),
  authorId: text(record.reviewer_id),
  subjectId: text(record.reviewee_id),
  overallScore: number(record.overall_score),
  comment: text(record.comment),
  verifiedCompletedJob: true,
  editableUntil: text(record.editable_until),
  categoryScores: rows(record.review_category_scores).map((score): RatingCategoryScore => ({
    category: score.category as RatingCategoryScore['category'],
    score: number(score.score),
  })),
  isDemo: bool(record.is_demo),
  createdAt: text(record.created_at),
  updatedAt: text(record.updated_at),
})

export const mapNotification = (record: DbRow): Notification => ({
  id: text(record.id),
  userId: text(record.user_id),
  type: record.type as Notification['type'],
  titleKey: text(record.title_key),
  messageKey: text(record.message_key),
  resourceId: nullableText(record.resource_id),
  readAt: nullableText(record.read_at),
  archivedAt: nullableText(record.archived_at),
  ...(row(record.metadata) && { metadata: row(record.metadata) as Record<string, string | number> }),
  isDemo: bool(record.is_demo),
  createdAt: text(record.created_at),
  updatedAt: text(record.updated_at),
})

export const mapSubscription = (record: DbRow): Subscription => ({
  id: text(record.user_id),
  userId: text(record.user_id),
  plan: record.plan as Subscription['plan'],
  status: record.status as Subscription['status'],
  unitAmount: number(record.unit_amount_cents),
  billingPeriod: record.billing_period === 'annual' ? 'annual' : 'monthly',
  stripeInterval: record.stripe_interval === 'year' ? 'year' : record.stripe_interval === 'month' ? 'month' : null,
  currency: 'EUR',
  trialStartedAt: nullableText(record.trial_started_at),
  trialEndsAt: nullableText(record.trial_ends_at),
  trialConsumed: bool(record.trial_consumed),
  currentPeriodStartedAt: nullableText(record.current_period_started_at),
  currentPeriodEndsAt: nullableText(record.current_period_ends_at),
  cancelledAt: nullableText(record.cancelled_at),
  cancelAtPeriodEnd: bool(record.cancel_at_period_end),
  gracePeriodEndsAt: nullableText(record.grace_period_ends_at),
  stripeCustomerId: nullableText(record.stripe_customer_id),
  stripeSubscriptionId: nullableText(record.stripe_subscription_id),
  stripePriceId: nullableText(record.stripe_price_id),
  lastSuccessfulPaymentAt: nullableText(record.last_successful_payment_at),
  lastFailedPaymentAt: nullableText(record.last_failed_payment_at),
  isDemo: bool(record.is_demo),
  createdAt: text(record.created_at),
  updatedAt: text(record.updated_at),
})

export const mapInvoice = (record: DbRow): BillingInvoice => ({
  id: text(record.id), userId: text(record.user_id), number: text(record.number),
  amountPaid: number(record.amount_paid_cents), currency: 'EUR',
  status: record.status as BillingInvoice['status'], issuedAt: text(record.issued_at),
  hostedInvoiceUrl: nullableText(record.hosted_invoice_url), isDemo: bool(record.is_demo),
  createdAt: text(record.created_at), updatedAt: text(record.updated_at),
})

export const mapPaymentMethod = (record: DbRow): PaymentMethod => ({
  id: text(record.id), userId: text(record.user_id), brand: text(record.brand), last4: text(record.last4),
  expiryMonth: number(record.expiry_month), expiryYear: number(record.expiry_year), isDefault: bool(record.is_default),
  isDemo: bool(record.is_demo), createdAt: text(record.created_at), updatedAt: text(record.updated_at),
})

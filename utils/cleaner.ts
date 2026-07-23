import type { Availability } from '~/domains/shared/types'
import type { CleanerProfile } from '~/domains/users/types'
import type { OfferFormData } from '~/schemas/validation'

export const defaultAvailability = (): Availability[] =>
  Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    enabled: weekday > 0 && weekday < 6,
    ranges: weekday > 0 && weekday < 6
      ? [{ start: '07:00', end: '12:00' }]
      : [],
  }))

export const normalizeCleanerProfile = (profile: CleanerProfile): CleanerProfile => ({
  ...profile,
  favouriteJobIds: [...(profile.favouriteJobIds ?? [])],
  vacationMode: profile.vacationMode ?? false,
  avatarUrl: profile.avatarUrl ?? null,
  onboardingCompleted: profile.onboardingCompleted ?? true,
  availability: profile.availability.length
    ? profile.availability.map((day) => ({
        ...day,
        ranges: day.ranges.map((range) => ({ ...range })),
      }))
    : defaultAvailability(),
})

export const getCleanerProfileCompletion = (profile: CleanerProfile): number => {
  const fields = [
    profile.firstName,
    profile.lastName,
    profile.phone,
    profile.cityCode,
    profile.biography,
    profile.hourlyRate,
    profile.minimumJobPrice,
    profile.serviceAreas.length,
    profile.languages.length,
  ]
  return Math.round(fields.filter(Boolean).length / fields.length * 100)
}

export const emptyOfferForm = (): OfferFormData => ({
  proposedPrice: 60,
  priceType: 'fixed',
  estimatedDurationHours: 2,
  availableArrivalTime: '10:00',
  message: '',
  suppliesIncluded: false,
  expiresAt: '',
})

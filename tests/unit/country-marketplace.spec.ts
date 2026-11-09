import { describe, expect, it } from 'vitest'
import type { CleaningJob } from '~/domains/jobs/types'
import type { CleanerProfile } from '~/domains/users/types'
import { getDefaultMarketplaceLocale, marketplaceLocaleCodes } from '~/config/marketplaces'
import { getMarketplacePlans } from '~/config/saas'
import { searchLocalCleaners, searchLocalJobs } from '~/services/search/localSearch'

const job = (countryCode: 'HR' | 'US'): CleaningJob => ({
  id: `job-${countryCode}`, ownerId: 'owner', assignedCleanerId: null, acceptedOfferId: null,
  title: 'Apartment cleaning', apartmentName: 'Apartment', cityCode: countryCode === 'US' ? 'us-fl-miami' : 'split',
  countryCode, currencyCode: countryCode === 'US' ? 'USD' : 'EUR', approximateArea: 'Centre', address: 'Address',
  hideExactAddress: true, sizeSquareMeters: 50, bedrooms: 1, bathrooms: 1, beds: 1, guestCapacity: 2,
  estimatedDurationHours: 2, preferredDate: '2026-12-01', preferredStartTime: '10:00', flexibleTime: false,
  proposedBudget: 50, budgetType: 'fixed', additionalInstructions: '', photoUrls: [], offerDeadline: '2026-11-30T12:00:00Z',
  status: 'published', offerCount: 0, isUrgent: false, services: {
    cleaningSuppliesProvided: false, linenReplacement: false, towelReplacement: false, laundry: false,
    balconyCleaning: false, fridgeCleaning: false, ovenCleaning: false, kitchenCleaning: true,
    windowCleaning: false, sameDayTurnover: false,
  }, isDemo: false, createdAt: '2026-11-09T00:00:00Z', updatedAt: '2026-11-09T00:00:00Z',
})

const cleaner = (countryCode: 'HR' | 'US'): CleanerProfile => ({
  id: `cleaner-${countryCode}`, userId: `user-${countryCode}`, firstName: 'Ana', lastName: 'Clean', phone: '',
  cityCode: countryCode === 'US' ? 'us-fl-miami' : 'split', countryCode,
  currencyCode: countryCode === 'US' ? 'USD' : 'EUR', hourlyRate: 20, minimumJobPrice: 40,
  serviceRadiusKm: 20, serviceAreas: [], availability: [], yearsOfExperience: 3, biography: 'Professional cleaner',
  companyName: null, oib: null, website: null, languages: ['en'], ownTransportation: true, bringsSupplies: true,
  sameDayAvailable: false, weekendAvailable: true, averageRating: null, ratingCount: 0, completedJobs: 0,
  favouriteJobIds: [], vacationMode: false, avatarUrl: null, onboardingCompleted: true, isDemo: false,
  createdAt: '2026-11-09T00:00:00Z', updatedAt: '2026-11-09T00:00:00Z',
})

describe('country marketplace isolation', () => {
  it('limits languages to the selected marketplace', () => {
    expect(marketplaceLocaleCodes.HR).toEqual(['hr', 'en'])
    expect(marketplaceLocaleCodes.US).toEqual(['en'])
    expect(getDefaultMarketplaceLocale('HR')).toBe('hr')
    expect(getDefaultMarketplaceLocale('US')).toBe('en')
  })

  it('uses localized display pricing for Croatia and the United States', () => {
    expect(getMarketplacePlans('HR')).toMatchObject({ currency: 'EUR', owner: { monthlyAmount: 1900 } })
    expect(getMarketplacePlans('US')).toMatchObject({
      currency: 'USD',
      owner: { monthlyAmount: 2100, annualAmount: 10900 },
      cleaner: { monthlyAmount: 4300, annualAmount: 21900 },
    })
  })

  it('returns jobs only from the selected country', () => {
    const result = searchLocalJobs([job('HR'), job('US')], {
      countryCode: 'US', search: '', sort: 'newest', page: 1, pageSize: 10,
    })
    expect(result.items.map((item) => item.countryCode)).toEqual(['US'])
  })

  it('returns cleaners only from the selected country', () => {
    const result = searchLocalCleaners([cleaner('HR'), cleaner('US')], {
      countryCode: 'HR', search: '', sort: 'newest', page: 1, pageSize: 10,
    })
    expect(result.items.map((item) => item.countryCode)).toEqual(['HR'])
  })
})

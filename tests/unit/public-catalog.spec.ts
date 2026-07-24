import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CleaningJob } from '~/domains/jobs/types'
import type { CleanerProfile } from '~/domains/users/types'
import { formatPrice, formatRating } from '~/utils/formatters'
import {
  emptyCleanerFilters,
  emptyJobFilters,
  filterCleaners,
  filterJobs,
  paginate,
  serializeQuery,
  sortCleaners,
  sortJobs,
} from '~/utils/publicCatalog'
import { getAppRoute, getCleanerRoute, getJobRoute } from '~/utils/routes'

const jobs = JSON.parse(readFileSync(resolve('data/mock/jobs.json'), 'utf8')) as CleaningJob[]
const cleaners = JSON.parse(
  readFileSync(resolve('data/mock/cleaners.json'), 'utf8'),
) as CleanerProfile[]

describe('public catalogue utilities', () => {
  it('filters jobs by city, price type, and service requirements', () => {
    const result = filterJobs(jobs, {
      ...emptyJobFilters(),
      city: 'dubrovnik',
      priceType: 'fixed',
      sameDay: true,
    })
    expect(result.length).toBeGreaterThan(0)
    expect(result.every((job) => job.cityCode === 'dubrovnik'
      && job.budgetType === 'fixed'
      && job.services.sameDayTurnover)).toBe(true)
  })

  it('sorts jobs by budget and date', () => {
    expect(sortJobs(jobs, 'budget-high')[0]?.proposedBudget)
      .toBe(Math.max(...jobs.map((job) => job.proposedBudget)))
    expect(sortJobs(jobs, 'date')[0]?.preferredDate)
      .toBe([...jobs].sort((a, b) => a.preferredDate.localeCompare(b.preferredDate))[0]?.preferredDate)
  })

  it('filters and sorts cleaner profiles', () => {
    const result = filterCleaners(cleaners, {
      ...emptyCleanerFilters(),
      supplies: true,
      transportation: true,
      language: 'en',
    })
    expect(result.every((cleaner) => cleaner.bringsSupplies
      && cleaner.ownTransportation
      && cleaner.languages.includes('en'))).toBe(true)
    expect(sortCleaners(cleaners, 'rate')[0]?.hourlyRate)
      .toBe(Math.min(...cleaners.map((cleaner) => cleaner.hourlyRate)))
  })

  it('paginates without mutating the source', () => {
    const source = [1, 2, 3, 4, 5]
    expect(paginate(source, 2, 2)).toEqual([3, 4])
    expect(source).toEqual([1, 2, 3, 4, 5])
  })

  it('serializes only active query values', () => {
    expect(serializeQuery({
      city: 'split',
      urgent: true,
      empty: '',
      inactive: false,
      missing: null,
    })).toEqual({ city: 'split', urgent: 'true' })
  })

  it('formats prices and ratings consistently', () => {
    expect(formatPrice(39, 'en')).toContain('39')
    expect(formatPrice(39, 'hr')).toContain('39')
    expect(formatPrice(39, 'sl')).toContain('39')
    expect(formatRating(4.86)).toBe('4.9')
    expect(formatRating(null)).toBeNull()
  })

  it('generates localized public routes', () => {
    expect(getAppRoute('jobs', 'hr')).toBe('/poslovi')
    expect(getAppRoute('jobs', 'en')).toBe('/en/jobs')
    expect(getAppRoute('jobs', 'sl')).toBe('/sl/dela')
    expect(getJobRoute('job-01', 'en')).toBe('/en/jobs/job-01')
    expect(getJobRoute('job-01', 'sl')).toBe('/sl/dela/job-01')
    expect(getCleanerRoute('cleaner-01', 'hr')).toBe('/cistaci/cleaner-01')
  })

  it('keeps the demo badge visible in its component contract', () => {
    const source = readFileSync(resolve('components/public/DemoBadge.vue'), 'utf8')
    expect(source).toContain('<BaseBadge')
    expect(source).toContain('demo.ratingBadge')
    expect(source).toContain('demo.profileBadge')
    expect(source).toContain('demo.listingBadge')
  })
})

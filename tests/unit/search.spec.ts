import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CleaningJob } from '~/domains/jobs/types'
import type { CleanerProfile } from '~/domains/users/types'
import {
  normalizeSearchText,
  searchLocalCleaners,
  searchLocalJobs,
} from '~/services/search/localSearch'

const jobs = JSON.parse(
  readFileSync(resolve('data/mock/jobs.json'), 'utf8'),
) as CleaningJob[]
const cleaners = JSON.parse(
  readFileSync(resolve('data/mock/cleaners.json'), 'utf8'),
) as CleanerProfile[]

const jobCriteria = (search: string) => ({
  search,
  sort: 'relevance' as const,
  page: 1,
  pageSize: 20,
})
const cleanerCriteria = (search: string) => ({
  search,
  sort: 'relevance' as const,
  page: 1,
  pageSize: 20,
})

describe('ranked marketplace search', () => {
  it('normalizes case and Croatian diacritics', () => {
    expect(normalizeSearchText('  ŠIBENIK  ')).toBe('sibenik')
  })

  it('finds jobs by partial city and all relevant text fields', () => {
    expect(searchLocalJobs(jobs, jobCriteria('Dubr')).items.length)
      .toBeGreaterThan(0)
    expect(searchLocalJobs(jobs, jobCriteria('dUbR')).items)
      .toEqual(searchLocalJobs(jobs, jobCriteria('Dubr')).items)

    const instruction = jobs.find((job) =>
      ['published', 'receiving_offers'].includes(job.status))
      ?.additionalInstructions.split(' ').find((word) => word.length > 7)
    expect(instruction).toBeTruthy()
    expect(searchLocalJobs(jobs, jobCriteria(instruction ?? '')).items.length)
      .toBeGreaterThan(0)
  })

  it('ranks an exact title above a description-only match', () => {
    const source = jobs.find((job) =>
      ['published', 'receiving_offers'].includes(job.status))
    expect(source).toBeTruthy()
    const exact = { ...structuredClone(source!), id: 'exact', title: 'Dubrovnik' }
    const description = {
      ...structuredClone(source!),
      id: 'description',
      title: 'Drugi oglas',
      additionalInstructions: 'Čišćenje u Dubrovniku',
    }
    expect(searchLocalJobs([description, exact], jobCriteria('Dubrovnik')).items[0]?.id)
      .toBe('exact')
  })

  it('searches cleaner names, biographies, cities and service areas', () => {
    const cleaner = cleaners[0]
    expect(cleaner).toBeTruthy()
    const namePrefix = cleaner!.firstName.slice(0, 3).toUpperCase()
    expect(searchLocalCleaners(cleaners, cleanerCriteria(namePrefix)).items)
      .toContainEqual(cleaner)

    const cityPrefix = cleaner!.cityCode.slice(0, 4)
    expect(searchLocalCleaners(cleaners, cleanerCriteria(cityPrefix)).items.length)
      .toBeGreaterThan(0)
  })

  it('paginates after ranking and returns the complete total', () => {
    const result = searchLocalCleaners(cleaners, {
      ...cleanerCriteria(''),
      pageSize: 9,
    })
    expect(result.items).toHaveLength(9)
    expect(result.total).toBe(cleaners.length)
  })
})

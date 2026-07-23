import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type DemoRecord = {
  id: string
  isDemo: boolean
  [key: string]: unknown
}

const readRecords = (name: string): DemoRecord[] => JSON.parse(
  readFileSync(resolve(process.cwd(), `data/mock/${name}.json`), 'utf8'),
) as DemoRecord[]

describe('mock data', () => {
  const expectedCounts = {
    owners: 15,
    cleaners: 37,
    jobs: 40,
    offers: 120,
  }

  it.each(Object.entries(expectedCounts))(
    'contains the expected number of %s',
    (name, expectedCount) => {
      expect(readRecords(name)).toHaveLength(expectedCount)
    },
  )

  it.each([
    'admins',
    'cities',
    'users',
    'credentials',
    'owners',
    'cleaners',
    'jobs',
    'offers',
    'ratings',
    'subscriptions',
    'notifications',
  ])('marks every %s record as demo data', (name) => {
    expect(readRecords(name).every((record) => record.isDemo === true)).toBe(true)
  })

  it('keeps job and offer references internally consistent', () => {
    const users = readRecords('users')
    const jobs = readRecords('jobs')
    const offers = readRecords('offers')
    const userIds = new Set(users.map((user) => user.id))
    const jobIds = new Set(jobs.map((job) => job.id))

    expect(jobs.every((job) => userIds.has(job.ownerId as string))).toBe(true)
    expect(offers.every((offer) =>
      jobIds.has(offer.jobId as string)
      && userIds.has(offer.cleanerId as string),
    )).toBe(true)
  })
})

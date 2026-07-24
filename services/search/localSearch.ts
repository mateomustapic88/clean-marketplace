import type { CleaningJob } from '~/domains/jobs/types'
import type {
  CleanerSearchSort,
  JobSearchSort,
  PublicCleanerSearch,
  PublicJobSearch,
  SearchPage,
} from '~/domains/search/types'
import type { CleanerProfile } from '~/domains/users/types'

export const normalizeSearchText = (value: string): string => value
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase()
  .trim()
  .replace(/\s+/g, ' ')

const relevance = (
  query: string,
  weightedFields: Array<{ value: string, weight: number }>,
): number => {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return 0
  const terms = normalizedQuery.split(' ')
  const combined = normalizeSearchText(weightedFields.map((field) => field.value).join(' '))
  if (!terms.every((term) => combined.includes(term))) return -1

  return weightedFields.reduce((score, field) => {
    const value = normalizeSearchText(field.value)
    if (!value) return score
    if (value === normalizedQuery) return score + field.weight * 8
    if (value.startsWith(normalizedQuery)) return score + field.weight * 5
    if (value.includes(normalizedQuery)) return score + field.weight * 3
    return score + terms.reduce(
      (termScore, term) => termScore + (value.includes(term) ? field.weight : 0),
      0,
    )
  }, 0)
}

const page = <T>(items: T[], currentPage: number, pageSize: number): SearchPage<T> => {
  const safeSize = Math.min(Math.max(pageSize, 1), 100)
  const offset = Math.max(currentPage - 1, 0) * safeSize
  return { items: items.slice(offset, offset + safeSize), total: items.length }
}

const sortJobs = (
  left: { item: CleaningJob, rank: number },
  right: { item: CleaningJob, rank: number },
  sort: JobSearchSort,
) => {
  if (sort === 'relevance' && right.rank !== left.rank) return right.rank - left.rank
  if (sort === 'date') return left.item.preferredDate.localeCompare(right.item.preferredDate)
  if (sort === 'budget-high') return right.item.proposedBudget - left.item.proposedBudget
  if (sort === 'budget-low') return left.item.proposedBudget - right.item.proposedBudget
  return right.item.createdAt.localeCompare(left.item.createdAt)
}

export const searchLocalJobs = (
  jobs: CleaningJob[],
  criteria: PublicJobSearch,
): SearchPage<CleaningJob> => {
  const matches = jobs.flatMap((job) => {
    const rank = relevance(criteria.search, [
      { value: job.title, weight: 12 },
      { value: job.apartmentName, weight: 10 },
      { value: job.cityCode, weight: 9 },
      { value: job.approximateArea, weight: 8 },
      { value: job.address, weight: 6 },
      { value: job.additionalInstructions, weight: 3 },
    ])
    const weekend = [0, 6].includes(new Date(`${job.preferredDate}T12:00:00`).getDay())
    if (
      !['published', 'receiving_offers'].includes(job.status)
      || rank < 0
      || (criteria.cityCode && job.cityCode !== criteria.cityCode)
      || (criteria.budgetType && job.budgetType !== criteria.budgetType)
      || (criteria.minimumBudget !== undefined && job.proposedBudget < criteria.minimumBudget)
      || (criteria.maximumBudget !== undefined && job.proposedBudget > criteria.maximumBudget)
      || (criteria.minimumSize !== undefined && job.sizeSquareMeters < criteria.minimumSize)
      || (criteria.sameDayTurnover && !job.services.sameDayTurnover)
      || (criteria.suppliesProvided && !job.services.cleaningSuppliesProvided)
      || (criteria.weekendOnly && !weekend)
      || (criteria.urgentOnly && !job.isUrgent)
      || (criteria.preferredDate && job.preferredDate !== criteria.preferredDate)
    ) return []
    return [{ item: job, rank }]
  }).sort((left, right) => sortJobs(left, right, criteria.sort))

  return page(matches.map((match) => match.item), criteria.page, criteria.pageSize)
}

const sortCleaners = (
  left: { item: CleanerProfile, rank: number },
  right: { item: CleanerProfile, rank: number },
  sort: CleanerSearchSort,
) => {
  if (sort === 'relevance' && right.rank !== left.rank) return right.rank - left.rank
  if (sort === 'rate') return left.item.hourlyRate - right.item.hourlyRate
  if (sort === 'completed') return right.item.completedJobs - left.item.completedJobs
  if (sort === 'newest') return right.item.createdAt.localeCompare(left.item.createdAt)
  return (right.item.averageRating ?? 0) - (left.item.averageRating ?? 0)
}

export const searchLocalCleaners = (
  cleaners: CleanerProfile[],
  criteria: PublicCleanerSearch,
): SearchPage<CleanerProfile> => {
  const matches = cleaners.flatMap((cleaner) => {
    const rank = relevance(criteria.search, [
      { value: `${cleaner.firstName} ${cleaner.lastName}`, weight: 12 },
      { value: cleaner.companyName ?? '', weight: 10 },
      { value: cleaner.cityCode, weight: 9 },
      { value: cleaner.serviceAreas.map((area) => area.cityCode).join(' '), weight: 8 },
      { value: cleaner.biography, weight: 4 },
      { value: cleaner.languages.join(' '), weight: 3 },
      { value: cleaner.website ?? '', weight: 2 },
    ])
    if (
      rank < 0
      || (criteria.cityCode && cleaner.cityCode !== criteria.cityCode
        && !cleaner.serviceAreas.some((area) => area.cityCode === criteria.cityCode))
      || (criteria.maximumHourlyRate !== undefined
        && cleaner.hourlyRate > criteria.maximumHourlyRate)
      || (criteria.maximumMinimumPrice !== undefined
        && cleaner.minimumJobPrice > criteria.maximumMinimumPrice)
      || (criteria.minimumRating !== undefined
        && (cleaner.averageRating ?? 0) < criteria.minimumRating)
      || (criteria.weekendAvailable && !cleaner.weekendAvailable)
      || (criteria.sameDayAvailable && !cleaner.sameDayAvailable)
      || (criteria.bringsSupplies && !cleaner.bringsSupplies)
      || (criteria.ownTransportation && !cleaner.ownTransportation)
      || (criteria.language && !cleaner.languages.includes(criteria.language))
    ) return []
    return [{ item: cleaner, rank }]
  }).sort((left, right) => sortCleaners(left, right, criteria.sort))

  return page(matches.map((match) => match.item), criteria.page, criteria.pageSize)
}

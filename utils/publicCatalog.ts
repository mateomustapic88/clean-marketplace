import type { CleaningJob } from '~/domains/jobs/types'
import type {
  CleanerSearchSort,
  JobSearchSort,
} from '~/domains/search/types'
import type { CleanerProfile } from '~/domains/users/types'
import { normalizeSearchText } from '~/services/search/localSearch'

export type JobSort = JobSearchSort
export type CleanerSort = CleanerSearchSort

export interface PublicJobFilters {
  search: string
  city: string
  priceType: string
  minimumPrice: number | null
  maximumPrice: number | null
  minimumSize: number | null
  sameDay: boolean
  supplies: boolean
  weekend: boolean
  urgent: boolean
  date: string
}

export interface PublicCleanerFilters {
  search: string
  city: string
  maximumRate: number | null
  maximumMinimumPrice: number | null
  minimumRating: number | null
  weekend: boolean
  sameDay: boolean
  supplies: boolean
  transportation: boolean
  language: string
}

export const emptyJobFilters = (): PublicJobFilters => ({
  search: '',
  city: '',
  priceType: '',
  minimumPrice: null,
  maximumPrice: null,
  minimumSize: null,
  sameDay: false,
  supplies: false,
  weekend: false,
  urgent: false,
  date: '',
})

export const emptyCleanerFilters = (): PublicCleanerFilters => ({
  search: '',
  city: '',
  maximumRate: null,
  maximumMinimumPrice: null,
  minimumRating: null,
  weekend: false,
  sameDay: false,
  supplies: false,
  transportation: false,
  language: '',
})

export const filterJobs = (
  jobs: CleaningJob[],
  filters: PublicJobFilters,
): CleaningJob[] => jobs.filter((job) => {
  const query = normalizeSearchText(filters.search)
  const searchable = normalizeSearchText([
    job.title,
    job.apartmentName,
    job.cityCode,
    job.approximateArea,
    job.address,
    job.additionalInstructions,
  ].join(' '))
  const weekend = [0, 6].includes(new Date(`${job.preferredDate}T12:00:00`).getDay())
  return (!query || query.split(' ').every((term) => searchable.includes(term)))
    && (!filters.city || job.cityCode === filters.city)
    && (!filters.priceType || job.budgetType === filters.priceType)
    && (filters.minimumPrice === null || job.proposedBudget >= filters.minimumPrice)
    && (filters.maximumPrice === null || job.proposedBudget <= filters.maximumPrice)
    && (filters.minimumSize === null || job.sizeSquareMeters >= filters.minimumSize)
    && (!filters.sameDay || job.services.sameDayTurnover)
    && (!filters.supplies || job.services.cleaningSuppliesProvided)
    && (!filters.weekend || weekend)
    && (!filters.urgent || job.isUrgent)
    && (!filters.date || job.preferredDate === filters.date)
})

export const sortJobs = (jobs: CleaningJob[], sort: JobSort): CleaningJob[] =>
  [...jobs].sort((left, right) => {
    if (sort === 'relevance') return 0
    if (sort === 'date') return left.preferredDate.localeCompare(right.preferredDate)
    if (sort === 'budget-high') return right.proposedBudget - left.proposedBudget
    if (sort === 'budget-low') return left.proposedBudget - right.proposedBudget
    return right.createdAt.localeCompare(left.createdAt)
  })

export const filterCleaners = (
  cleaners: CleanerProfile[],
  filters: PublicCleanerFilters,
): CleanerProfile[] => cleaners.filter((cleaner) => {
  const query = normalizeSearchText(filters.search)
  const searchable = normalizeSearchText([
    cleaner.firstName,
    cleaner.lastName,
    cleaner.biography,
    cleaner.companyName ?? '',
    cleaner.cityCode,
    cleaner.serviceAreas.map((area) => area.cityCode).join(' '),
    cleaner.languages.join(' '),
    cleaner.website ?? '',
  ].join(' '))
  return (!query || query.split(' ').every((term) => searchable.includes(term)))
    && (!filters.city || cleaner.cityCode === filters.city
      || cleaner.serviceAreas.some((area) => area.cityCode === filters.city))
    && (filters.maximumRate === null || cleaner.hourlyRate <= filters.maximumRate)
    && (filters.maximumMinimumPrice === null
      || cleaner.minimumJobPrice <= filters.maximumMinimumPrice)
    && (filters.minimumRating === null
      || (cleaner.averageRating ?? 0) >= filters.minimumRating)
    && (!filters.weekend || cleaner.weekendAvailable)
    && (!filters.sameDay || cleaner.sameDayAvailable)
    && (!filters.supplies || cleaner.bringsSupplies)
    && (!filters.transportation || cleaner.ownTransportation)
    && (!filters.language || cleaner.languages.includes(filters.language))
})

export const sortCleaners = (
  cleaners: CleanerProfile[],
  sort: CleanerSort,
): CleanerProfile[] => [...cleaners].sort((left, right) => {
  if (sort === 'relevance') return 0
  if (sort === 'rate') return left.hourlyRate - right.hourlyRate
  if (sort === 'completed') return right.completedJobs - left.completedJobs
  if (sort === 'newest') return right.createdAt.localeCompare(left.createdAt)
  return (right.averageRating ?? 0) - (left.averageRating ?? 0)
})

export const paginate = <T>(items: T[], page: number, size: number): T[] =>
  items.slice((page - 1) * size, page * size)

export const serializeQuery = (
  values: Record<string, string | number | boolean | null | undefined>,
): Record<string, string> => Object.fromEntries(
  Object.entries(values)
    .filter(([, value]) => value !== '' && value !== null && value !== false
      && value !== undefined)
    .map(([key, value]) => [key, String(value)]),
)

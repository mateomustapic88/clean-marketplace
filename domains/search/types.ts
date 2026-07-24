import type { BudgetType } from '~/domains/jobs/types'

export type JobSearchSort = 'relevance' | 'newest' | 'date' | 'budget-high' | 'budget-low'
export type CleanerSearchSort = 'relevance' | 'rating' | 'rate' | 'completed' | 'newest'

export interface SearchPage<TEntity> {
  items: TEntity[]
  total: number
}

interface PaginatedSearch {
  search: string
  page: number
  pageSize: number
}

export interface PublicJobSearch extends PaginatedSearch {
  cityCode?: string
  budgetType?: BudgetType
  minimumBudget?: number
  maximumBudget?: number
  minimumSize?: number
  sameDayTurnover?: boolean
  suppliesProvided?: boolean
  weekendOnly?: boolean
  urgentOnly?: boolean
  preferredDate?: string
  sort: JobSearchSort
}

export interface PublicCleanerSearch extends PaginatedSearch {
  cityCode?: string
  maximumHourlyRate?: number
  maximumMinimumPrice?: number
  minimumRating?: number
  weekendAvailable?: boolean
  sameDayAvailable?: boolean
  bringsSupplies?: boolean
  ownTransportation?: boolean
  language?: string
  sort: CleanerSearchSort
}

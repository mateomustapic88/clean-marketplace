export interface DemoEntity {
  id: string
  isDemo: boolean
  createdAt: string
  updatedAt: string
}

export interface City extends DemoEntity {
  code: string
  name: string
  county: string
}

export interface ServiceArea {
  cityCode: string
  radiusKm: number
}

export interface TimeRange {
  start: string
  end: string
}

export interface Availability {
  weekday: number
  enabled: boolean
  ranges: TimeRange[]
}

export type PreferredContactMethod = 'email' | 'phone' | 'sms'

export interface RepositoryListOptions {
  limit?: number
  offset?: number
}

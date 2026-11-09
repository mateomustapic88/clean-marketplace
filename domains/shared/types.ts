export interface DemoEntity {
  id: string
  isDemo: boolean
  createdAt: string
  updatedAt: string
}

export type CountryCode = 'HR' | 'US'
export type CurrencyCode = 'EUR' | 'USD'
export type MeasurementSystem = 'metric' | 'imperial'

export interface Country {
  code: CountryCode
  currencyCode: CurrencyCode
  measurementSystem: MeasurementSystem
  defaultTimeZone: string
}

export interface City extends DemoEntity {
  code: string
  name: string
  county: string
  countryCode: CountryCode
  regionCode: string
  regionName: string
  timeZone: string
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

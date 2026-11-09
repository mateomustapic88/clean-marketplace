import type { City, Country, CountryCode } from '~/domains/shared/types'

export type MarketplaceLocaleCode = 'hr' | 'en'

export const marketplaceLocaleCodes: Record<CountryCode, readonly MarketplaceLocaleCode[]> = {
  HR: ['hr', 'en'],
  US: ['en'],
}

export const getDefaultMarketplaceLocale = (countryCode: CountryCode): MarketplaceLocaleCode =>
  countryCode === 'US' ? 'en' : 'hr'

export const marketplaceCountries: readonly Country[] = [
  {
    code: 'HR',
    currencyCode: 'EUR',
    measurementSystem: 'metric',
    defaultTimeZone: 'Europe/Zagreb',
  },
  {
    code: 'US',
    currencyCode: 'USD',
    measurementSystem: 'imperial',
    defaultTimeZone: 'America/New_York',
  },
]

export const isCountryCode = (value: unknown): value is CountryCode =>
  value === 'HR' || value === 'US'

export const getMarketplaceCountry = (code: CountryCode) =>
  marketplaceCountries.find((country) => country.code === code)!

export const marketplaceCityLabel = (city: City) => city.countryCode === 'US'
  ? `${city.name}, ${city.regionCode}`
  : city.name

import type { City, Country, CountryCode } from '~/domains/shared/types'

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

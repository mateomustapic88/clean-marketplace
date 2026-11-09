const localeTag = (locale: string) => locale === 'en'
  ? 'en-GB'
  : locale === 'sl'
    ? 'sl-SI'
    : 'hr-HR'

export const formatPrice = (value: number, locale = 'hr', currency: 'EUR' | 'USD' = 'EUR') =>
  new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)

export const formatArea = (squareMeters: number, measurementSystem: 'metric' | 'imperial') =>
  measurementSystem === 'imperial'
    ? `${Math.round(squareMeters * 10.7639)} sq ft`
    : `${squareMeters} m²`

export const formatRating = (value: number | null) =>
  value === null ? null : value.toFixed(1)

export const formatPublicDate = (value: string, locale = 'hr') =>
  new Intl.DateTimeFormat(localeTag(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`
      : value,
  ))

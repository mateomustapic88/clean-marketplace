const localeTag = (locale: string) => locale === 'en'
  ? 'en-GB'
  : locale === 'sl'
    ? 'sl-SI'
    : 'hr-HR'

export const formatPrice = (value: number, locale = 'hr') =>
  new Intl.NumberFormat(localeTag(locale), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)

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

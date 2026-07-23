export const formatPrice = (value: number, locale = 'hr') =>
  new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'hr-HR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)

export const formatRating = (value: number | null) =>
  value === null ? null : value.toFixed(1)

export const formatPublicDate = (value: string, locale = 'hr') =>
  new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'hr-HR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`
      : value,
  ))

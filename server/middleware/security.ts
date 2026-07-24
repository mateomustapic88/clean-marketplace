export default defineEventHandler((event) => {
  const isProduction = process.env.NODE_ENV === 'production'

  setResponseHeaders(event, {
    'Content-Security-Policy': [
      "default-src 'self'",
      "base-uri 'self'",
      "connect-src 'self' https://api.stripe.com",
      "font-src 'self' data:",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      'frame-src https://checkout.stripe.com https://js.stripe.com',
      "img-src 'self' data: blob: https:",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      ...(isProduction ? ['upgrade-insecure-requests'] : []),
    ].join('; '),
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(self "https://checkout.stripe.com")',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  })

  if (isProduction) {
    setResponseHeader(
      event,
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )
  }
})

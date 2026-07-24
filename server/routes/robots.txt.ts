import { defineEventHandler, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /dashboard',
    'Disallow: /dashboard-cleaner',
    'Disallow: /onboarding',
    'Disallow: /en/admin',
    'Disallow: /en/dashboard',
    'Disallow: /en/dashboard-cleaner',
    'Disallow: /en/onboarding',
    'Disallow: /sl/admin',
    'Disallow: /sl/nadzorna-plosca',
    'Disallow: /sl/nadzorna-plosca-cistilec',
    'Disallow: /sl/uvajanje',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
})

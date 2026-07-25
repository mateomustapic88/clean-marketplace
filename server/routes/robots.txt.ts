import { defineEventHandler, setResponseHeader } from 'h3'

const privatePaths = [
  '/admin',
  '/dashboard',
  '/dashboard-cleaner',
  '/onboarding',
  '/en/admin',
  '/en/dashboard',
  '/en/dashboard-cleaner',
  '/en/onboarding',
  '/sl/admin',
  '/sl/nadzorna-plosca',
  '/sl/nadzorna-plosca-cistilec',
  '/sl/uvajanje',
] as const

const crawlerGroup = (userAgent: string): string[] => [
  `User-agent: ${userAgent}`,
  'Allow: /',
  ...privatePaths.map((path) => `Disallow: ${path}`),
  '',
]

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=86400')
  const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  return [
    ...crawlerGroup('*'),
    ...crawlerGroup('OAI-SearchBot'),
    ...crawlerGroup('ChatGPT-User'),
    ...crawlerGroup('GPTBot'),
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
})

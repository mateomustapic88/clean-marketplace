import { defineEventHandler, setResponseHeader } from 'h3'

const publicPaths = [
  '/',
  '/cijene',
  '/cistaci',
  '/kako-funkcionira',
  '/kontakt',
  '/politika-kolacica',
  '/politika-privatnosti',
  '/poslovi',
  '/registracija',
  '/uvjeti-koristenja',
  '/en',
  '/en/cleaners',
  '/en/contact',
  '/en/cookie-policy',
  '/en/how-it-works',
  '/en/jobs',
  '/en/pricing',
  '/en/privacy',
  '/en/register',
  '/en/terms',
] as const

const escapeXml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&apos;')

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  const urls = publicPaths
    .map((path) => `<url><loc>${escapeXml(`${siteUrl}${path}`)}</loc></url>`)
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`
})

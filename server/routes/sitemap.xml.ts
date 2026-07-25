import { defineEventHandler, setResponseHeader } from 'h3'
import { createAdminSupabaseClient } from '~/infrastructure/supabase/serverClient'

type Locale = 'hr' | 'en' | 'sl'

interface SitemapEntry {
  paths: Record<Locale, string>
  lastmod?: string
}

const staticEntries: SitemapEntry[] = [
  { paths: { hr: '/', en: '/en', sl: '/sl' } },
  {
    paths: {
      hr: '/ciscenje-apartmana',
      en: '/en/apartment-cleaning-croatia',
      sl: '/sl/ciscenje-apartmajev-hrvaska',
    },
  },
  { paths: { hr: '/cijene', en: '/en/pricing', sl: '/sl/cene' } },
  { paths: { hr: '/cistaci', en: '/en/cleaners', sl: '/sl/cistilci' } },
  { paths: { hr: '/kako-funkcionira', en: '/en/how-it-works', sl: '/sl/kako-deluje' } },
  { paths: { hr: '/kontakt', en: '/en/contact', sl: '/sl/kontakt' } },
  {
    paths: {
      hr: '/politika-kolacica',
      en: '/en/cookie-policy',
      sl: '/sl/politika-piskotkov',
    },
  },
  {
    paths: {
      hr: '/politika-privatnosti',
      en: '/en/privacy',
      sl: '/sl/politika-zasebnosti',
    },
  },
  { paths: { hr: '/poslovi', en: '/en/jobs', sl: '/sl/dela' } },
  { paths: { hr: '/registracija', en: '/en/register', sl: '/sl/registracija' } },
  {
    paths: {
      hr: '/uvjeti-koristenja',
      en: '/en/terms',
      sl: '/sl/pogoji-uporabe',
    },
  },
]

const escapeXml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&apos;')

const dynamicEntries = async (): Promise<SitemapEntry[]> => {
  try {
    const database = createAdminSupabaseClient()
    const [jobsResult, cleanersResult] = await Promise.all([
      database.from('jobs')
        .select('id, updated_at')
        .in('status', ['published', 'receiving_offers'])
        .gte('offer_deadline', new Date().toISOString())
        .eq('is_demo', false),
      database.from('profiles')
        .select('id, updated_at')
        .eq('role', 'cleaner')
        .eq('status', 'active')
        .eq('onboarding_completed', true)
        .eq('is_demo', false),
    ])
    if (jobsResult.error || cleanersResult.error) return []
    const jobs = (jobsResult.data ?? []).map((job) => ({
      paths: {
        hr: `/poslovi/${job.id}`,
        en: `/en/jobs/${job.id}`,
        sl: `/sl/dela/${job.id}`,
      },
      lastmod: job.updated_at,
    }))
    const cleaners = (cleanersResult.data ?? []).map((cleaner) => ({
      paths: {
        hr: `/cistaci/${cleaner.id}`,
        en: `/en/cleaners/${cleaner.id}`,
        sl: `/sl/cistilci/${cleaner.id}`,
      },
      lastmod: cleaner.updated_at,
    }))
    return [...jobs, ...cleaners]
  }
  catch {
    return []
  }
}

const renderEntry = (entry: SitemapEntry, locale: Locale, siteUrl: string): string => {
  const location = `${siteUrl}${entry.paths[locale]}`
  const alternates = (Object.entries(entry.paths) as Array<[Locale, string]>)
    .map(([code, path]) =>
      `<xhtml:link rel="alternate" hreflang="${code === 'en' ? 'en-GB' : `${code}-${code.toUpperCase()}`}" href="${escapeXml(`${siteUrl}${path}`)}"/>`,
    )
    .join('')
  const defaultLink = `<xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${siteUrl}${entry.paths.hr}`)}"/>`
  const lastmod = entry.lastmod
    ? `<lastmod>${escapeXml(new Date(entry.lastmod).toISOString())}</lastmod>`
    : ''
  return `<url><loc>${escapeXml(location)}</loc>${alternates}${defaultLink}${lastmod}</url>`
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  setResponseHeader(
    event,
    'cache-control',
    'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  )
  const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  const entries = [...staticEntries, ...await dynamicEntries()]
  const urls = entries
    .flatMap((entry) => (['hr', 'en', 'sl'] as const)
      .map((locale) => renderEntry(entry, locale, siteUrl)))
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`
})

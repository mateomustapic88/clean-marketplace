import { defineEventHandler, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600, s-maxage=86400')
  const siteUrl = String(useRuntimeConfig().public.siteUrl).replace(/\/$/, '')
  return [
    '# Clean Marketplace',
    '',
    '> Clean Marketplace is a Croatian marketplace that connects apartment owners with independent cleaning professionals.',
    '',
    '## Primary public pages',
    '',
    `- [Apartment cleaning in Croatia](${siteUrl}/ciscenje-apartmana)`,
    `- [Cleaning professionals](${siteUrl}/cistaci)`,
    `- [Apartment cleaning jobs](${siteUrl}/poslovi)`,
    `- [How Clean Marketplace works](${siteUrl}/kako-funkcionira)`,
    `- [Pricing](${siteUrl}/cijene)`,
    '',
    '## Important facts',
    '',
    '- Apartment owners publish cleaning requirements and compare offers.',
    '- Cleaning professionals maintain their own profiles, rates, availability, and service areas.',
    '- Clean Marketplace does not process the payment for the cleaning service or charge commission on it.',
    '- Demo listings, profiles, and ratings are visibly marked as Demo and are not real customer claims.',
    '- Private account, contact, billing, and dashboard data is not public content.',
    '',
  ].join('\n')
})

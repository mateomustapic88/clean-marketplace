import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import hr from '~/locales/hr.json'
import en from '~/locales/en.json'
import sl from '~/locales/sl.json'
import { getAppRoute } from '~/utils/routes'

const projectFile = (path: string) => new URL(`../../${path}`, import.meta.url)

describe('search visibility', () => {
  it('publishes localized apartment-cleaning landing routes and copy', () => {
    expect(getAppRoute('apartmentCleaning', 'hr')).toBe('/ciscenje-apartmana')
    expect(getAppRoute('apartmentCleaning', 'en')).toBe('/en/apartment-cleaning-croatia')
    expect(getAppRoute('apartmentCleaning', 'sl')).toBe('/sl/ciscenje-apartmajev-hrvaska')
    for (const locale of [hr, en, sl]) {
      expect(locale.apartmentCleaning.metaTitle).toBeTruthy()
      expect(locale.apartmentCleaning.metaDescription).toBeTruthy()
      expect(locale.apartmentCleaning.faq.items['1'].question).toBeTruthy()
      expect(locale.meta.socialImageAlt).toBeTruthy()
    }
  })

  it('makes public content discoverable without exposing private routes', () => {
    const robots = readFileSync(projectFile('server/routes/robots.txt.ts'), 'utf8')
    expect(robots).toContain("crawlerGroup('OAI-SearchBot')")
    expect(robots).toContain("crawlerGroup('ChatGPT-User')")
    expect(robots).toContain("'/dashboard'")

    const sitemap = readFileSync(projectFile('server/routes/sitemap.xml.ts'), 'utf8')
    expect(sitemap).toContain('/ciscenje-apartmana')
    expect(sitemap).toContain(".eq('is_demo', false)")
    expect(sitemap).toContain("['published', 'receiving_offers']")
    expect(sitemap).toContain('hreflang=')
  })

  it('ships a correctly sized social sharing image', () => {
    const image = projectFile('public/images/clean-apartment-cleaning-og.png')
    expect(existsSync(image)).toBe(true)
    const png = readFileSync(image)
    expect(png.readUInt32BE(16)).toBe(1200)
    expect(png.readUInt32BE(20)).toBe(630)
  })
})

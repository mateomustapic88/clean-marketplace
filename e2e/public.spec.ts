import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const openHydratedPage = async (page: Page, path: string) => {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

test('opens the homepage and changes language', async ({ page }) => {
  await openHydratedPage(page, '/')
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Pronađite pouzdanu osobu za čišćenje apartmana',
  })).toBeVisible()
  await page.getByRole('link', { name: /English/ }).first().click()
  await expect(page).toHaveURL(/\/en/)
})

test('publishes an indexable apartment-cleaning landing page', async ({ page }) => {
  await openHydratedPage(page, '/ciscenje-apartmana')
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Čišćenje apartmana na Jadranu, bez nepreglednih poruka',
  })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/ciscenje-apartmana$/,
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /index, follow/,
  )
  await expect(page.getByRole('link', {
    name: 'Osobe za čišćenje - Split',
  })).toHaveAttribute('href', '/cistaci?city=split')
  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => node.textContent).join(''))
  expect(structuredData).toContain('"@type":"Service"')
})

test('opens the complete Slovenian locale', async ({ page }) => {
  await openHydratedPage(page, '/')
  await page.getByRole('link', { name: /Slovenščina/ }).first().click()
  await expect(page).toHaveURL(/\/sl/)
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Poiščite zanesljivega strokovnjaka za čiščenje apartmajev',
  })).toBeVisible()
})

test('browses and filters jobs before opening a detail', async ({ page }) => {
  await openHydratedPage(page, '/poslovi')
  await page.getByLabel('Grad').first().selectOption('dubrovnik')
  await expect(page).toHaveURL(/city=dubrovnik/)
  await page.locator('article.job-card').first().getByRole('link').click()
  await expect(page).toHaveURL(/\/poslovi\/job-/)
  await expect(page.getByText('Primjer oglasa').first()).toBeVisible()
})

test('finds jobs with case-insensitive partial search', async ({ page }) => {
  await openHydratedPage(page, '/poslovi')
  await page.getByLabel('Pretraživanje').first().fill('dUbR')
  await expect(page).toHaveURL(/search=dUbR/)
  await expect(page.locator('article.job-card')).not.toHaveCount(0)
  await expect(page.locator('article.job-card').first()).toContainText('Dubrovnik')
})

test('browses cleaners and opens a public profile', async ({ page }) => {
  await openHydratedPage(page, '/cistaci')
  await page.locator('article.cleaner-card').first().getByRole('link').first().click()
  await expect(page).toHaveURL(/\/cistaci\/cleaner-/)
  await expect(page.getByText('Demo profil').first()).toBeVisible()
})

test('opens pricing and registration', async ({ page }) => {
  await openHydratedPage(page, '/')
  await expect(page.getByRole('heading', {
    name: 'Jasna mjesečna pretplata za obje uloge',
  })).toBeVisible()
  await expect(page.getByText(/19\s*€/).first()).toBeVisible()
  await expect(page.getByText(/39\s*€/).first()).toBeVisible()

  await openHydratedPage(page, '/cijene')
  await expect(page.getByRole('heading', {
    name: 'Clean za vlasnike apartmana',
  })).toBeVisible()
  await expect(page.getByRole('heading', {
    name: 'Clean za osobe za čišćenje',
  })).toBeVisible()
  await expect(page.getByText(/19\s*€/).first()).toBeVisible()
  await expect(page.getByText(/39\s*€/).first()).toBeVisible()
  await expect(page.getByText('Besplatno za vlasnike')).toHaveCount(0)
  await page.getByRole('radio', { name: /Godišnje/ }).check()
  await expect(page.getByText(/99\s*€/).first()).toBeVisible()
  await expect(page.getByText(/199\s*€/).first()).toBeVisible()
  await expect(page.getByText('Uštedi 57%')).toBeVisible()
  await expect(page.getByText(/Ušteda 129\s*€ godišnje \(57%\)/).first()).toBeVisible()
  await expect(page.getByText(/Ušteda 269\s*€ godišnje \(57%\)/).first()).toBeVisible()

  await page.getByRole('heading', {
    name: 'Clean za osobe za čišćenje',
  }).locator('..').getByRole('link', { name: 'Započni probno razdoblje' }).click()
  await expect(page).toHaveURL(/\/registracija\?role=cleaner$/)
  await expect(page.getByRole('radio', { name: /Pružam usluge čišćenja/ })).toBeChecked()

  await openHydratedPage(page, '/registracija')
  await expect(page.getByRole('radio', { name: /Vlasnik apartmana/ })).toBeVisible()
  await expect(page.getByText(
    'Vlasnicima apartmana i osobama za čišćenje dostupno je sedam dana probnog razdoblja kroz sigurnu naplatu.',
  )).toBeVisible()
})

test('mobile navigation is keyboard accessible', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await openHydratedPage(page, '/')
  await page.getByRole('button', { name: 'Izbornik' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
})

test('publishes complete legal and feedback navigation', async ({ page }) => {
  await openHydratedPage(page, '/')
  await expect(page.getByText(/beta/i)).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Prijavi grešku' })).toHaveAttribute('href', '/kontakt?topic=bug')
  await expect(page.getByRole('link', { name: 'Predloži poboljšanje' })).toHaveAttribute('href', '/kontakt?topic=feature')
  await page.getByRole('link', { name: 'Politika kolačića' }).click()
  await expect(page).toHaveURL(/\/politika-kolacica$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Politika kolačića' })).toBeVisible()
})

test('serves canonical social metadata, robots, sitemap, and security headers', async ({ page, request }) => {
  const response = await page.goto('/cijene')
  expect(response?.headers()['x-content-type-options']).toBe('nosniff')
  expect(response?.headers()['x-frame-options']).toBe('DENY')
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'")
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/cijene$/)
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/images\/clean-apartment-cleaning-og\.png$/,
  )
  await expect(page.locator('link[rel="icon"][type="image/png"]')).toHaveAttribute(
    'href',
    '/favicon-96x96.png',
  )

  const favicon = await request.get('/favicon.ico')
  expect(favicon.ok()).toBeTruthy()
  expect(favicon.headers()['content-type']).toMatch(/^image\/(?:x-icon|vnd\.microsoft\.icon)/)
  expect((await favicon.body()).byteLength).toBeGreaterThan(100)

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  const robotsText = await robots.text()
  expect(robotsText).toContain('Disallow: /dashboard')
  expect(robotsText).toContain('User-agent: OAI-SearchBot')

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  const sitemapText = await sitemap.text()
  expect(sitemapText).toContain('/politika-kolacica')
  expect(sitemapText).toContain('/ciscenje-apartmana')
  expect(sitemapText).toContain('hreflang="hr-HR"')

  const llms = await request.get('/llms.txt')
  expect(llms.ok()).toBeTruthy()
  expect(await llms.text()).toContain('/ciscenje-apartmana')
})

test('clears an expired session and redirects protected routes to login', async ({ page }) => {
  await openHydratedPage(page, '/')
  await page.evaluate(() => {
    localStorage.setItem('clean_marketplace_auth_session', JSON.stringify({
      id: 'expired-session',
      userId: 'owner-user-01',
      createdAt: '2026-01-01T00:00:00.000Z',
      expiresAt: '2026-01-01T00:00:01.000Z',
      isDemo: true,
    }))
  })
  await openHydratedPage(page, '/dashboard')
  await expect(page).toHaveURL(/\/prijava$/)
  expect(await page.evaluate(() => localStorage.getItem('clean_marketplace_auth_session'))).toBeNull()
})

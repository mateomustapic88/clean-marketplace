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

test('browses and filters jobs before opening a detail', async ({ page }) => {
  await openHydratedPage(page, '/poslovi')
  await page.getByLabel('Grad').first().selectOption('dubrovnik')
  await expect(page).toHaveURL(/city=dubrovnik/)
  await page.locator('article.job-card').first().getByRole('link').click()
  await expect(page).toHaveURL(/\/poslovi\/job-/)
  await expect(page.getByText('Primjer oglasa').first()).toBeVisible()
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

  await openHydratedPage(page, '/registracija')
  await expect(page.getByRole('radio', { name: /Vlasnik apartmana/ })).toBeVisible()
  await expect(page.getByText(
    'Vlasnici apartmana i osobe za čišćenje dobivaju sedam dana probnog razdoblja prije mjesečne pretplate.',
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

test('publishes complete private-beta legal and feedback navigation', async ({ page }) => {
  await openHydratedPage(page, '/')
  await expect(page.getByText('Privatna beta')).toBeVisible()
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
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary')

  const robots = await request.get('/robots.txt')
  expect(robots.ok()).toBeTruthy()
  expect(await robots.text()).toContain('Disallow: /dashboard')

  const sitemap = await request.get('/sitemap.xml')
  expect(sitemap.ok()).toBeTruthy()
  expect(await sitemap.text()).toContain('/politika-kolacica')
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

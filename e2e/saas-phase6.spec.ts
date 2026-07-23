import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const login = async (page: Page, email: string, expectedPath: RegExp) => {
  await page.goto('/prijava')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Adresa e-pošte').fill(email)
  await page.getByLabel('Lozinka').fill('Demo1234')
  await page.getByRole('button', { name: 'Prijavi se' }).click()
  await expect(page).toHaveURL(expectedPath)
}

test('billing server endpoints require an authenticated HTTP-only session', async ({ request }) => {
  const checkout = await request.post('/api/billing/checkout', {
    data: {
      successPath: '/dashboard/billing',
      cancelPath: '/dashboard/billing',
    },
  })
  expect(checkout.status()).toBe(401)
  const portal = await request.post('/api/billing/portal', {
    data: { returnPath: '/dashboard/billing' },
  })
  expect(portal.status()).toBe(401)
})

test('billing portal rejects an authenticated user without a Stripe customer', async ({ page }) => {
  await login(page, 'cleaner01@demo.clean.hr', /\/dashboard-cleaner$/)
  const response = await page.request.post('/api/billing/portal', {
    data: { returnPath: '/dashboard-cleaner/billing' },
  })
  expect(response.status()).toBe(409)
})

test('subscription middleware redirects an inactive cleaner to billing', async ({ page }) => {
  await login(page, 'cleaner05@demo.clean.hr', /\/dashboard-cleaner$/)
  await page.goto('/dashboard-cleaner/poslovi/job-02/ponuda')
  await expect(page).toHaveURL(/\/dashboard-cleaner\/billing$/)
  await expect(page.getByRole('heading', { name: 'Pretplata i naplata' })).toBeVisible()
  await expect(page.getByText('Plaćanje kasni').first()).toBeVisible()
})

test('mock checkout activates a plan and exposes invoice and card details', async ({ page }) => {
  await login(page, 'cleaner01@demo.clean.hr', /\/dashboard-cleaner$/)
  await page.goto('/dashboard-cleaner/billing')
  await expect(page.getByText('Probno', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Osoba za čišćenje' })).toBeVisible()
  await expect(page.getByText(/39\s*€/).first()).toBeVisible()
  await expect(page.getByText('Besplatno probno razdoblje od 7 dana')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pogodnosti' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Upravljaj pretplatom' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Način plaćanja' })).toBeVisible()
  await page.getByRole('button', { name: 'Započni besplatno probno razdoblje' }).click()
  await expect(page).toHaveURL(/checkout=success/)
  await expect(page.getByText('Aktivno', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('VISA **** 4242')).toBeVisible()
  await expect(page.getByRole('cell', { name: /DEMO-/ })).toBeVisible()
  await page.getByRole('button', { name: 'Otvori portal za naplatu' }).click()
  await expect(page).toHaveURL(/portal=returned/)
})

test('notification centre updates unread state and archives items', async ({ page }) => {
  await login(page, 'owner01@demo.clean.hr', /\/dashboard$/)
  await page.goto('/dashboard/obavijesti')
  const cards = page.locator('.notification-card')
  await expect(cards.first()).toBeVisible()
  const initialCount = await cards.count()
  const unreadButton = page.getByRole('button', { name: 'Označi pročitanom' }).first()
  if (await unreadButton.isVisible()) await unreadButton.click()
  await cards.first().getByRole('button', { name: 'Arhiviraj' }).click()
  await expect(cards).toHaveCount(initialCount - 1)
})

test('completed jobs expose verified bilateral review details', async ({ page }) => {
  await login(page, 'owner05@demo.clean.hr', /\/dashboard$/)
  await page.goto('/dashboard/poslovi/job-05/recenzija')
  await expect(page.getByRole('heading', { name: 'Ocjena završene suradnje' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Spremi promjene' })).toBeVisible()
  await page.goto('/cistaci/cleaner-05')
  await expect(page.getByText('Potvrđen završeni posao').first()).toBeVisible()
  await expect(page.getByText('Kvaliteta čišćenja').first()).toBeVisible()
})

test('owner billing is role-specific, responsive, and protects publishing', async ({ page }) => {
  await login(page, 'owner01@demo.clean.hr', /\/dashboard$/)
  await page.goto('/dashboard/billing')
  await expect(page.getByRole('heading', { name: 'Vlasnik apartmana' })).toBeVisible()
  await expect(page.getByText('Plan za vlasnika').first()).toBeVisible()
  await expect(page.getByText(/19\s*€/).first()).toBeVisible()
  await expect(page.getByText('Besplatno probno razdoblje od 7 dana')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pogodnosti' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Upravljaj pretplatom' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Računi' })).toBeVisible()
  await expect(page.getByText('Plan za osobu za čišćenje')).toHaveCount(0)

  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.reload()
    expect(await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )).toBe(false)
  }

  await page.evaluate(() => {
    const key = 'clean_marketplace_mock_database'
    const snapshot = JSON.parse(localStorage.getItem(key) ?? '{}')
    const subscription = snapshot.subscriptions?.find(
      (item: { userId: string }) => item.userId === 'owner-user-01',
    )
    if (subscription) subscription.status = 'expired'
    localStorage.setItem(key, JSON.stringify(snapshot))
  })
  await page.goto('/dashboard/poslovi/novi')
  await expect(page).toHaveURL(/\/dashboard\/billing$/)
})

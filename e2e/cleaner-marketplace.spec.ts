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

const logout = async (page: Page) => {
  await page.getByRole('button', { name: /Odjav/ }).click()
  await expect(page).toHaveURL(/\/prijava$/)
}

test('restores the cleaner session and keeps all cleaner pages responsive', async ({ page }) => {
  test.setTimeout(90_000)
  await login(page, 'cleaner01@demo.clean.hr', /\/dashboard-cleaner$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dobro došli')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dobro došli')

  const paths = [
    '/dashboard-cleaner',
    '/dashboard-cleaner/poslovi',
    '/dashboard-cleaner/favoriti',
    '/dashboard-cleaner/ponude',
    '/dashboard-cleaner/prihvaceni-poslovi',
    '/dashboard-cleaner/dostupnost',
    '/dashboard-cleaner/profil',
  ]
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of paths) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `${path} at ${width}px`).toBe(false)
    }
  }
})

test('saves a favourite job and weekly availability', async ({ page }) => {
  await login(page, 'cleaner01@demo.clean.hr', /\/dashboard-cleaner$/)
  await page.goto('/dashboard-cleaner/poslovi')
  const job = page.locator('.job-summary-card').filter({ hasText: 'Priprema apartmana za novu rezervaciju' }).first()
  await job.getByRole('button', { name: 'Spremi' }).click()
  await expect(job.getByRole('button', { name: 'Ukloni' })).toBeVisible()
  await page.goto('/dashboard-cleaner/favoriti')
  await expect(page.locator('.job-summary-card').filter({ hasText: 'Priprema apartmana za novu rezervaciju' })).toBeVisible()

  await page.goto('/dashboard-cleaner/dostupnost')
  await page.getByText('Na odmoru sam i trenutačno nisam dostupna', { exact: true }).click()
  await page.locator('.cleaner-availability__week select').first().selectOption('morning')
  await page.getByRole('button', { name: 'Spremi dostupnost' }).click()
  await expect(page.getByText('Dostupnost je spremljena.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Na odmoru sam i trenutačno nisam dostupna')).toBeChecked()
})

test('submits an offer that the owner accepts and exposes contact details afterward', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await login(page, 'cleaner01@demo.clean.hr', /\/dashboard-cleaner$/)
  await page.goto('/dashboard-cleaner/poslovi/job-02/ponuda')
  await page.getByLabel('Predložena cijena').fill('78')
  await page.getByLabel('Procijenjeno trajanje u satima').fill('3')
  await page.getByLabel('Vrijeme dolaska').fill('09:30')
  await page.getByLabel('Ponuda vrijedi do').fill('2026-09-01T12:00')
  await page.getByLabel('Poruka vlasniku').fill('Mogu doći na vrijeme i donijeti potrebna sredstva za čišćenje.')
  await page.getByText('Sredstva za čišćenje uključena su u cijenu', { exact: true }).click()
  await page.getByRole('button', { name: 'Pošalji ponudu' }).click()
  await expect(page).toHaveURL(/\/dashboard-cleaner\/ponude$/)
  await expect(page.locator('.offer-card').filter({ hasText: '78' })).toContainText('Na čekanju')

  await logout(page)
  await login(page, 'owner02@demo.clean.hr', /\/dashboard$/)
  await page.goto('/dashboard/poslovi/job-02/ponude')
  await page.waitForLoadState('networkidle')
  expect(pageErrors).toEqual([])
  const marijaOffer = page.locator('.offer-comparison-card').filter({ hasText: 'Marija Knežević' })
  await marijaOffer.getByRole('button', { name: 'Prihvati ponudu' }).click()
  await expect(page.getByText('Odabrana je osoba za čišćenje.')).toBeVisible()
  await expect(marijaOffer.getByText('Kontaktni podaci')).toBeVisible()
  await expect(marijaOffer.getByRole('link', { name: 'cleaner01@demo.clean.hr' })).toBeVisible()

  await logout(page)
  await login(page, 'cleaner01@demo.clean.hr', /\/dashboard-cleaner$/)
  await page.goto('/dashboard-cleaner/ponude')
  const accepted = page.locator('.offer-card')
    .filter({ hasText: 'Priprema apartmana za novu rezervaciju' })
    .filter({ hasText: 'Prihvaćena' })
  await expect(accepted).toContainText('Prihvaćena')
  await expect(accepted.getByText('Kontakt vlasnika')).toBeVisible()
})

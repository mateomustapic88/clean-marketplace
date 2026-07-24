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

test('blocks offers on demo jobs with a friendly explanation', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await login(page, 'cleaner01@demo.clean.hr', /\/dashboard-cleaner$/)
  await page.goto('/dashboard-cleaner/poslovi/job-02')
  await page.getByRole('button', { name: 'Pošalji ponudu' }).click()
  await expect(page.getByText('Ovo je demonstracijski oglas i nije moguće poslati ponudu.')).toBeVisible()

  await page.goto('/dashboard-cleaner/poslovi/job-02/ponuda')
  await expect(page.getByText('Ovo je demonstracijski oglas i nije moguće poslati ponudu.')).toBeVisible()
  await expect(page.getByLabel('Predložena cijena')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})

test('new cleaner can finish account setup', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/registracija')
  await page.waitForLoadState('networkidle')
  await page.getByRole('radio', { name: /Pružam usluge čišćenja/ }).check()
  await page.locator('input[name="firstName"]').fill('Ivana')
  await page.locator('input[name="lastName"]').fill('Testić')
  await page.getByLabel('Adresa e-pošte').fill(`ivana.${Date.now()}@example.com`)
  await page.getByLabel('Telefon').fill('+385 91 555 0123')
  await page.getByLabel('Grad').selectOption('split')
  await page.getByLabel('Lozinka').fill('Sigurna123')
  await page.getByRole('button', { name: 'Izradi račun' }).click()

  await expect(page).toHaveURL(/\/onboarding\/cistac$/)
  await page.getByRole('button', { name: 'Sljedeće' }).click()
  await page.getByLabel('O meni i iskustvo').fill(
    'Pouzdana sam i temeljita osoba s iskustvom u čišćenju apartmana.',
  )
  await expect(page.getByRole('checkbox', { name: 'Hrvatski' })).toBeChecked()
  await page.getByRole('button', { name: 'Sljedeće' }).click()
  await page.getByRole('button', { name: 'Sljedeće' }).click()
  await page.getByRole('button', { name: 'Sljedeće' }).click()
  await page.getByRole('button', { name: 'Završi postavljanje' }).click()

  await expect(page).toHaveURL(/\/dashboard-cleaner$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dobro došli')
})

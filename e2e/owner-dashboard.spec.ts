import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const loginAsOwner = async (page: Page) => {
  await page.goto('/prijava')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Adresa e-pošte').fill('owner01@demo.clean.hr')
  await page.getByLabel('Lozinka').fill('Demo1234')
  await page.getByRole('button', { name: 'Prijavi se' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dobro došli')
}

test('restores an owner session and exposes the responsive dashboard navigation', async ({ page }) => {
  await loginAsOwner(page)
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dobro došli')

  await page.setViewportSize({ width: 375, height: 812 })
  await page.getByRole('button', { name: 'Otvori navigaciju vlasnika' }).click()
  const drawer = page.getByRole('dialog')
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('link', { name: 'Moji poslovi' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
})

test('prompts an incomplete owner once per session and guards job publishing', async ({ page }) => {
  await page.goto('/registracija')
  await page.waitForLoadState('networkidle')
  await page.getByRole('radio', { name: /Vlasnik apartmana/ }).check()
  await page.locator('input[name="firstName"]').fill('Nedovršeni')
  await page.locator('input[name="lastName"]').fill('Vlasnik')
  await page.getByLabel('Adresa e-pošte').fill(`owner.${Date.now()}@example.com`)
  await page.getByLabel('Telefon').fill('+385 91 555 0202')
  await page.getByLabel('Grad').selectOption('split')
  await page.getByLabel('Lozinka').fill('Sigurna123')
  await page.getByRole('button', { name: 'Izradi račun' }).click()
  await expect(page).toHaveURL(/\/onboarding\/vlasnik$/)

  await page.goto('/dashboard')

  const prompt = page.getByRole('dialog', { name: 'Dovršite profil' })
  await expect(prompt).toBeVisible()
  await prompt.getByRole('button', { name: 'Nastavi kasnije' }).click()
  await expect(prompt).toBeHidden()
  await expect(page.getByText('Vaš profil još nije dovršen')).toBeVisible()

  await page.reload()
  await expect(prompt).toBeHidden()
  await page.getByRole('button', { name: 'Objavi novi posao' }).first().click()
  await expect(page).toHaveURL(/\/onboarding\/vlasnik\?reason=profile_required$/)
  await expect(page.getByText('Prvo dovršite profil')).toBeVisible()
})

test('filters owner jobs and opens a job detail', async ({ page }) => {
  await loginAsOwner(page)
  await page.getByRole('link', { name: 'Moji poslovi' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Moji poslovi čišćenja' })).toBeVisible()
  await page.getByLabel('Status').selectOption('published')
  await expect(page.locator('.job-summary-card')).not.toHaveCount(0)
  await page.locator('.job-summary-card').first().getByRole('link').first().click()
  await expect(page.getByText('Primjer oglasa').first()).toBeVisible()
  await expect(page.getByText('Aktivnost')).toBeVisible()
})

test('creates and publishes a complete demo job', async ({ page }) => {
  await loginAsOwner(page)
  await page.getByRole('link', { name: 'Novi posao' }).first().click()

  await page.getByLabel('Naslov posla').fill('Čišćenje apartmana nakon odlaska gostiju')
  await page.getByLabel('Naziv apartmana').fill('Apartman Lavanda')
  await page.getByLabel('Grad').selectOption('split')
  await page.getByLabel('Približna lokacija').fill('Bačvice')
  await page.getByLabel('Točna adresa').fill('Preradovićevo šetalište 10')
  await page.getByRole('button', { name: 'Sljedeće' }).click()

  await page.getByRole('button', { name: 'Sljedeće' }).click()
  await page.getByRole('button', { name: 'Sljedeće' }).click()
  await page.getByRole('button', { name: 'Sljedeće' }).click()
  await page.getByLabel('Željeni datum').fill('2026-08-15')
  await page.getByLabel('Vrijeme početka').fill('11:00')
  await page.getByLabel('Rok za ponude').fill('2026-08-10T18:00')
  await page.getByRole('button', { name: 'Sljedeće' }).click()
  await page.getByRole('button', { name: 'Objavi posao' }).click()

  await expect(page).toHaveURL(/\/dashboard\/poslovi\/job-/)
  await expect(page.getByRole('heading', {
    level: 1,
    name: 'Čišćenje apartmana nakon odlaska gostiju',
  })).toBeVisible()
  await expect(page.getByText('Objavljeno').first()).toBeVisible()
  await expect(page.getByText('Primjer oglasa').first()).toBeVisible()
})

test('renders the English owner experience with localized routes', async ({ page }) => {
  await loginAsOwner(page)
  await page.goto('/en/dashboard')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome')
  await page.getByRole('link', { name: 'New job' }).first().click()
  await expect(page).toHaveURL(/\/en\/dashboard\/jobs\/new$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Publish a cleaning job' })).toBeVisible()
})

test('keeps owner pages within the viewport at supported breakpoints', async ({ page }) => {
  test.setTimeout(90_000)
  await loginAsOwner(page)
  const paths = [
    '/dashboard',
    '/dashboard/poslovi',
    '/dashboard/poslovi/novi',
    '/dashboard/profil',
    '/dashboard/postavke',
  ]

  for (const width of [375, 393, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of paths) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (path === '/dashboard/profil') {
        await expect(page.locator('.owner-profile-page form')).toBeVisible()
      }
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      )
      expect(hasHorizontalOverflow, `${path} at ${width}px`).toBe(false)
      const hasClippedFormControl = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.base-card input, .base-card select')]
          .some((control) => {
            const card = control.closest<HTMLElement>('.base-card')
            if (!card) return false
            return control.getBoundingClientRect().right > card.getBoundingClientRect().right + 1
          }),
      )
      expect(hasClippedFormControl, `${path} has a clipped form control at ${width}px`).toBe(false)
    }
  }
})

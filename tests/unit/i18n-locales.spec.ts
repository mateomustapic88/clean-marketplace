import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

interface Messages {
  [key: string]: string | Messages
}

const readMessages = (locale: string): Messages => JSON.parse(
  readFileSync(resolve(`locales/${locale}.json`), 'utf8'),
) as Messages

const flatten = (
  messages: Messages,
  prefix = '',
  result = new Map<string, string>(),
): Map<string, string> => {
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result.set(path, value)
    else flatten(value, path, result)
  }
  return result
}

const placeholders = (value: string): string[] =>
  [...value.matchAll(/\{[^{}]+\}/g)].map((match) => match[0]).sort()

describe('localised messages', () => {
  const locales = ['hr', 'en', 'sl'] as const
  const catalogs = {
    hr: flatten(readMessages('hr')),
    en: flatten(readMessages('en')),
    sl: flatten(readMessages('sl')),
  }

  it('keeps every locale structurally complete', () => {
    const expectedKeys = [...catalogs.hr.keys()]
    for (const locale of locales) {
      expect([...catalogs[locale].keys()]).toEqual(expectedKeys)
    }
  })

  it('preserves interpolation placeholders in every translation', () => {
    for (const key of catalogs.hr.keys()) {
      expect(placeholders(catalogs.en.get(key) ?? ''), key)
        .toEqual(placeholders(catalogs.hr.get(key) ?? ''))
      expect(placeholders(catalogs.sl.get(key) ?? ''), key)
        .toEqual(placeholders(catalogs.hr.get(key) ?? ''))
    }
  })

  it('keeps the Clean product name untranslated in Slovenian', () => {
    expect(catalogs.sl.get('meta.siteName')).toBe('Clean')
    expect(catalogs.sl.get('header.brandLabel')).toContain('Clean')
    expect(catalogs.sl.get('footer.copyright')).toContain('Clean')
  })

  it('does not expose beta language in the application', () => {
    for (const locale of locales) {
      for (const message of catalogs[locale].values()) {
        expect(message).not.toMatch(/\bbeta\b/i)
      }
    }
  })
})

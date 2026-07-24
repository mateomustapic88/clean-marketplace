import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('production demo marketplace seed', () => {
  it('contains exactly 20 jobs and 40 cleaner profiles', () => {
    const output = execFileSync(
      process.execPath,
      [resolve('scripts/seed-demo-marketplace.mjs'), '--validate'],
      { encoding: 'utf8' },
    )

    expect(output).toContain('20 jobs and 40 cleaners')
  })
})

import { describe, expect, it } from 'vitest'
import { demoDisplayName, demoDisplayText } from '~/utils/demoPresentation'

describe('demo presentation', () => {
  it('removes the seed prefix only from demo content', () => {
    expect(demoDisplayText('[DEMO] Čišćenje apartmana', true)).toBe('Čišćenje apartmana')
    expect(demoDisplayName('[DEMO] Marija', 'Knežević', true)).toBe('Marija Knežević')
  })

  it('never changes real listing text', () => {
    expect(demoDisplayText('[DEMO] Naziv stvarnog oglasa', false)).toBe('[DEMO] Naziv stvarnog oglasa')
  })
})

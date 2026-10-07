import { expect, it } from 'vitest'
import { normalizeRange } from './dates'

it('caps the range at 26 weeks by moving the other end', () => {
  expect(normalizeRange({ from: '2026-01-05', to: '2027-01-01' }, 'to')).toEqual({
    from: '2026-07-06',
    to: '2027-01-03',
  })
})

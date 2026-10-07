import { describe, expect, it } from 'vitest'
import { mondayOf, normalizeRange, sundayOf } from './dates'

describe('week snapping', () => {
  it('snaps to Monday and Sunday across a year boundary', () => {
    expect(mondayOf('2026-01-01')).toBe('2025-12-29')
    expect(mondayOf('2025-12-29')).toBe('2025-12-29')
    expect(sundayOf('2026-01-01')).toBe('2026-01-04')
  })
})

describe('normalizeRange', () => {
  it('pushes the end forward when from moves past it', () => {
    expect(normalizeRange({ from: '2026-03-04', to: '2026-01-11' }, 'from')).toEqual({
      from: '2026-03-02',
      to: '2026-03-08',
    })
  })

  it('caps the range at 26 weeks by moving the other end', () => {
    expect(normalizeRange({ from: '2026-01-05', to: '2027-01-01' }, 'to')).toEqual({
      from: '2026-07-06',
      to: '2027-01-03',
    })
  })
})

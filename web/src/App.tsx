import { useState } from 'react'
import { CapacityGrid } from './CapacityGrid'
import { addDays, mondayOf, normalizeRange, today, type Range } from './dates'

const DEFAULT_WEEKS = 8

export function App() {
  const [range, setRange] = useState<Range>(() => {
    const from = mondayOf(today())
    return { from, to: addDays(from, DEFAULT_WEEKS * 7 - 1) }
  })

  function shift(weeks: number) {
    setRange({ from: addDays(range.from, weeks * 7), to: addDays(range.to, weeks * 7) })
  }

  function change(edge: keyof Range, value: string) {
    if (value) setRange(normalizeRange({ ...range, [edge]: value }, edge))
  }

  return (
    <main>
      <h1>Team capacity</h1>
      <nav className="range">
        <button onClick={() => shift(-1)} aria-label="Previous week">
          ←
        </button>
        <label>
          From <input type="date" value={range.from} onChange={(e) => change('from', e.target.value)} />
        </label>
        <label>
          To <input type="date" value={range.to} onChange={(e) => change('to', e.target.value)} />
        </label>
        <button onClick={() => shift(1)} aria-label="Next week">
          →
        </button>
      </nav>
      <CapacityGrid from={range.from} to={range.to} />
    </main>
  )
}

import { useState } from 'react'
import type { PersonCapacity } from './api'
import { shortDate } from './dates'
import { useCapacity, useUpdateWeeklyHours } from './queries'

type Props = {
  from: string
  to: string
}

export function CapacityGrid({ from, to }: Props) {
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useCapacity(from, to)

  if (isPending) return <p className="status">Loading…</p>

  return (
    <>
      {error && (
        <p className="banner" role="alert">
          Couldn't load capacity: {error.message} <button onClick={() => refetch()}>Retry</button>
        </p>
      )}
      {data && (
        <div className={isPlaceholderData || error ? 'grid stale' : 'grid'} aria-busy={isFetching}>
          {isFetching && <span className="status">Updating…</span>}
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Weekly hours</th>
                {data.weeks.map((w) => (
                  <th key={w}>{shortDate(w)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.people.map((p) => (
                <Row key={p.id} person={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function Row({ person }: { person: PersonCapacity }) {
  const [draft, setDraft] = useState<string | null>(null)
  const save = useUpdateWeeklyHours()

  function submit() {
    if (draft === null || save.isPending) return
    const weeklyHours = Number(draft)
    if (draft.trim() === '' || weeklyHours === person.weekly_hours) {
      cancel()
      return
    }
    save.mutate(
      { id: person.id, weeklyHours, previous: person.weekly_hours },
      { onSuccess: () => setDraft(null) },
    )
  }

  function cancel() {
    setDraft(null)
    save.reset()
  }

  return (
    <tr>
      <th scope="row">{person.name}</th>
      <td className="hours">
        {draft === null ? (
          <button className="edit" onClick={() => setDraft(String(person.weekly_hours))}>
            {person.weekly_hours}
          </button>
        ) : (
          <input
            type="number"
            min={0}
            max={168}
            step={0.5}
            autoFocus
            aria-label={`Weekly hours for ${person.name}`}
            value={draft}
            readOnly={save.isPending}
            onChange={(e) => {
              setDraft(e.target.value)
              if (save.isError) save.reset()
            }}
            // After a failure, clicking away without editing keeps the error and
            // sends nothing; editing clears it, so blur saves the new value.
            onBlur={save.isError ? undefined : submit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') cancel()
            }}
          />
        )}
        {save.isPending && <span className="saving">saving…</span>}
        {save.isError && (
          <span className="error" role="alert">
            {save.error.message}
          </span>
        )}
      </td>
      {person.allocated.map((allocated, i) => {
        const capacity = person.capacity[i]
        const over = allocated > capacity
        return (
          <td
            key={i}
            className={over ? 'cell over' : allocated === 0 ? 'cell idle' : 'cell'}
            title={over ? `Over by ${round(allocated - capacity)}h` : undefined}
          >
            {round(allocated)} / {round(capacity)}
          </td>
        )
      })}
    </tr>
  )
}

function round(n: number) {
  return Math.round(n * 10) / 10
}

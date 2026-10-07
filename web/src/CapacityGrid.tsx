import { Alert, Avatar, Button, Group, Input, Loader, Skeleton, Stack, Text, VisuallyHidden } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { useState } from 'react'
import type { PersonCapacity } from './api'
import { mondayOf, shortDate, today } from './dates'
import { useCapacity, useUpdateWeeklyHours } from './queries'

type Props = {
  from: string
  to: string
}

export function CapacityGrid({ from, to }: Props) {
  const { data, error, isPending, isFetching, isPlaceholderData, refetch } = useCapacity(from, to)
  const currentWeek = mondayOf(today())

  if (isPending) {
    return (
      <Stack gap="sm" p="lg" aria-busy>
        <VisuallyHidden>Loading…</VisuallyHidden>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} height={28} />
        ))}
      </Stack>
    )
  }

  return (
    <>
      {error && (
        <Alert
          color="coral"
          variant="light"
          m="md"
          icon={<IconAlertCircle size={18} />}
          title="Couldn't load capacity"
        >
          <Group justify="space-between">
            <Text size="sm">{error.message}</Text>
            <Button size="xs" color="coral" variant="light" onClick={() => refetch()}>
              Retry
            </Button>
          </Group>
        </Alert>
      )}
      {data && (
        <div className={isPlaceholderData || error ? 'grid stale' : 'grid'} aria-busy={isFetching}>
          <table>
            <thead>
              <tr>
                <th>
                  <Group gap="xs" wrap="nowrap">
                    Team member
                    {isFetching && (
                      <Group gap={4} role="status" className="updating">
                        <Loader size={12} /> Updating…
                      </Group>
                    )}
                  </Group>
                </th>
                <th className="hours">Weekly hours</th>
                {data.weeks.map((w) => (
                  <th key={w} className={w === currentWeek ? 'week current' : 'week'}>
                    {shortDate(w)}
                  </th>
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
      <th scope="row">
        <Group gap="sm" wrap="nowrap">
          <Avatar name={person.name} color="initials" size={28} aria-hidden />
          <Text size="sm" fw={500}>
            {person.name}
          </Text>
        </Group>
      </th>
      <td className="hours">
        <Group gap={6} wrap="nowrap">
          {draft === null ? (
            <Button variant="light" size="compact-sm" miw={48} onClick={() => setDraft(String(person.weekly_hours))}>
              {person.weekly_hours}
            </Button>
          ) : (
            <Input
              type="number"
              size="xs"
              w={72}
              min={0}
              max={168}
              step={0.5}
              autoFocus
              aria-label={`Weekly hours for ${person.name}`}
              value={draft}
              readOnly={save.isPending}
              error={save.isError}
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
          {save.isPending && (
            <Group gap={4} role="status">
              <Loader size={14} />
              <VisuallyHidden>Saving…</VisuallyHidden>
            </Group>
          )}
        </Group>
        {save.isError && (
          <Text size="xs" c="coral" mt={4} role="alert">
            {save.error.message}
          </Text>
        )}
      </td>
      {person.allocated.map((allocated, i) => {
        const capacity = person.capacity[i]
        const over = allocated > capacity
        const fill = capacity > 0 ? Math.min(allocated / capacity, 1) : allocated > 0 ? 1 : 0
        return (
          <td
            key={i}
            className={over ? 'cell over' : allocated === 0 ? 'cell idle' : 'cell'}
            title={over ? `Over by ${round(allocated - capacity)}h` : undefined}
          >
            {round(allocated)} / {round(capacity)}
            <span className="bar" style={{ ['--fill' as string]: `${fill * 100}%` }} />
          </td>
        )
      })}
    </tr>
  )
}

function round(n: number) {
  return Math.round(n * 10) / 10
}

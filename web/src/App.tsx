import { ActionIcon, Box, Button, Group, Paper, Text, Title, Tooltip } from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { useState } from 'react'
import { CapacityGrid } from './CapacityGrid'
import { addDays, daysBetween, mondayOf, normalizeRange, today, type Range } from './dates'

const DEFAULT_WEEKS = 8
const DATE_FORMAT = 'MMM D, YYYY'

dayjs.extend(customParseFormat)

// Accepts what the field displays ("Oct 5, 2026") as well as ISO dates.
function parseDate(text: string): string | null {
  const d = dayjs(text.trim(), [DATE_FORMAT, 'YYYY-MM-DD'], true)
  return d.isValid() ? d.format('YYYY-MM-DD') : null
}

export function App() {
  const [range, setRange] = useState<Range>(() => {
    const from = mondayOf(today())
    return { from, to: addDays(from, DEFAULT_WEEKS * 7 - 1) }
  })

  function shift(weeks: number) {
    setRange((prev) => ({ from: addDays(prev.from, weeks * 7), to: addDays(prev.to, weeks * 7) }))
  }

  // Keeps the current range length, starting from this week.
  function thisWeek() {
    setRange((prev) => {
      const from = mondayOf(today())
      return { from, to: addDays(from, daysBetween(prev.from, prev.to)) }
    })
  }

  function change(edge: keyof Range, value: string | null) {
    if (value) setRange(normalizeRange({ ...range, [edge]: value }, edge))
  }

  return (
    <>
      <Box component="header" className="topbar">
        <Text className="brand">capacity</Text>
      </Box>
      <Box component="main" p={{ base: 'md', sm: 'xl' }}>
        <Group justify="space-between" align="flex-end" mb="lg" gap="md">
          <div>
            <Title order={2}>Team capacity</Title>
            <Text c="dimmed" size="sm">
              Allocated vs. available hours per week
            </Text>
          </div>
          <Group gap="xs" wrap="nowrap">
            <Tooltip label="Previous week">
              <ActionIcon variant="default" size="lg" onClick={() => shift(-1)} aria-label="Previous week">
                <IconChevronLeft size={18} />
              </ActionIcon>
            </Tooltip>
            <Button variant="default" onClick={thisWeek}>
              This week
            </Button>
            <Tooltip label="Next week">
              <ActionIcon variant="default" size="lg" onClick={() => shift(1)} aria-label="Next week">
                <IconChevronRight size={18} />
              </ActionIcon>
            </Tooltip>
            <DateInput
              aria-label="From"
              leftSection={<IconCalendar size={16} />}
              valueFormat={DATE_FORMAT}
              dateParser={parseDate}
              value={range.from}
              onChange={(v) => change('from', v)}
              w={150}
            />
            <Text c="dimmed">–</Text>
            <DateInput
              aria-label="To"
              leftSection={<IconCalendar size={16} />}
              valueFormat={DATE_FORMAT}
              dateParser={parseDate}
              value={range.to}
              onChange={(v) => change('to', v)}
              w={150}
            />
          </Group>
        </Group>
        <Paper withBorder shadow="xs" radius="lg" className="card">
          <CapacityGrid from={range.from} to={range.to} />
        </Paper>
      </Box>
    </>
  )
}

const DAY_MS = 86_400_000

export const MAX_WEEKS = 26

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function format(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  return format(new Date(parse(iso).getTime() + days * DAY_MS))
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / DAY_MS)
}

export function mondayOf(iso: string): string {
  return addDays(iso, -((parse(iso).getUTCDay() + 6) % 7))
}

export function sundayOf(iso: string): string {
  return addDays(mondayOf(iso), 6)
}

export function today(): string {
  const d = new Date()
  return format(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())))
}

export function shortDate(iso: string): string {
  return parse(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export type Range = { from: string; to: string }

// Snaps to whole weeks and keeps the range within 1..MAX_WEEKS weeks by moving
// the end the user did not just change.
export function normalizeRange({ from, to }: Range, changed: 'from' | 'to'): Range {
  const maxDays = MAX_WEEKS * 7 - 1
  let f = mondayOf(from)
  let t = sundayOf(to)
  if (changed === 'from') {
    if (t < f) t = addDays(f, 6)
    if (t > addDays(f, maxDays)) t = addDays(f, maxDays)
  } else {
    if (f > t) f = addDays(t, -6)
    if (f < addDays(t, -maxDays)) f = addDays(t, -maxDays)
  }
  return { from: f, to: t }
}

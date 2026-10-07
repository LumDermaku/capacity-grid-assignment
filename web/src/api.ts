export type PersonCapacity = {
  id: number
  name: string
  weekly_hours: number
  allocated: number[]
  capacity: number[]
}

export type Capacity = {
  from: string
  to: string
  weeks: string[]
  people: PersonCapacity[]
}

export type Person = {
  id: number
  name: string
  weekly_hours: number
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return body as T
}

export function fetchCapacity(from: string, to: string, signal?: AbortSignal) {
  return request<Capacity>(`/api/capacity?${new URLSearchParams({ from, to })}`, { signal })
}

export function updateWeeklyHours(id: number, weeklyHours: number) {
  return request<Person>(`/api/people/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weekly_hours: weeklyHours }),
  })
}

export function withWeeklyHours(data: Capacity, id: number, weeklyHours: number): Capacity {
  return {
    ...data,
    people: data.people.map((p) =>
      p.id === id
        ? { ...p, weekly_hours: weeklyHours, capacity: p.capacity.map(() => weeklyHours) }
        : p,
    ),
  }
}

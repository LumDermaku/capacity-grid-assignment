import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCapacity, updateWeeklyHours, type Capacity } from './api'

const capacityKey = ['capacity'] as const
const updateKey = ['updateWeeklyHours'] as const

export function useCapacity(from: string, to: string) {
  return useQuery({
    queryKey: [...capacityKey, from, to],
    queryFn: ({ signal }) => fetchCapacity(from, to, signal),
    placeholderData: keepPreviousData,
  })
}

type UpdateVars = { id: number; weeklyHours: number; previous: number }

// Optimistic: every cached range shows the new capacity immediately. A failure
// restores only this person's previous value, so concurrent edits to other
// rows survive. Once the last save settles, the active range is refetched.
export function useUpdateWeeklyHours() {
  const qc = useQueryClient()
  const setCachedWeeklyHours = (id: number, hours: number) =>
    qc.setQueriesData<Capacity>({ queryKey: capacityKey }, (d) => d && withWeeklyHours(d, id, hours))

  return useMutation({
    mutationKey: updateKey,
    mutationFn: ({ id, weeklyHours }: UpdateVars) => updateWeeklyHours(id, weeklyHours),
    onMutate: async ({ id, weeklyHours }) => {
      await qc.cancelQueries({ queryKey: capacityKey })
      setCachedWeeklyHours(id, weeklyHours)
    },
    onError: (_err, { id, previous }) => setCachedWeeklyHours(id, previous),
    onSuccess: (person) => setCachedWeeklyHours(person.id, person.weekly_hours),
    onSettled: () => {
      if (qc.isMutating({ mutationKey: updateKey }) === 1) {
        return qc.invalidateQueries({ queryKey: capacityKey })
      }
    },
  })
}

function withWeeklyHours(data: Capacity, id: number, weeklyHours: number): Capacity {
  return {
    ...data,
    people: data.people.map((p) =>
      p.id === id
        ? { ...p, weekly_hours: weeklyHours, capacity: p.capacity.map(() => weeklyHours) }
        : p,
    ),
  }
}

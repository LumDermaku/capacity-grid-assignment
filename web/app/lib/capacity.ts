import { CombinedGraphQLErrors, NetworkStatus, ServerError, ServerParseError, type ErrorLike } from '@apollo/client'
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react'
import { isReference } from '@apollo/client/utilities'
import { useLayoutEffect, useRef, useState } from 'react'
import {
  CapacityDocument,
  UpdateWeeklyHoursDocument,
  type CapacityQuery,
} from '../graphql/generated/graphql'

export type CapacityRow = CapacityQuery['capacity']['rows'][number]
export type Person = CapacityRow['person']

// While a new range loads, the previous one stays on screen (dimmed), like
// TanStack's keepPreviousData, which also drops it once the new range fails.
export function useCapacity(from: string, to: string) {
  const variables = useCommittedVariables(from, to)
  const { data, previousData, error, loading, networkStatus, refetch } = useQuery(CapacityDocument, {
    variables,
    fetchPolicy: 'cache-and-network',
  })
  // Apollo clears the error as a refetch starts; TanStack kept it while it
  // refetched over data it already had, so the alert stays up during Retry.
  const lastError = useRef<ErrorLike | undefined>(undefined)
  if (error || !loading) lastError.current = error
  const placeholder = error ? undefined : previousData
  return {
    data: (data ?? placeholder)?.capacity,
    error: error ?? (networkStatus === NetworkStatus.refetch && data ? lastError.current : undefined),
    isPending: loading && !data && !placeholder,
    isFetching: loading,
    isPlaceholderData: !data && !!placeholder,
    refetch,
  }
}

// useQuery switches its query to new variables while rendering. Range changes
// arrive in router transitions, which React can render and then throw away; the
// next ordinary render switches the query back, and each switch aborts the other
// request. Only hand useQuery a range once it has been committed.
function useCommittedVariables(from: string, to: string) {
  const [variables, setVariables] = useState({ from, to })
  useLayoutEffect(() => setVariables((v) => (v.from === from && v.to === to ? v : { from, to })), [from, to])
  return variables
}

// Saves in flight across all rows. The visible range is refetched once the last
// one settles, so a refetch can't land between two saves and show an old value.
let pendingSaves = 0

// Optimistic: Person is normalised, so weeklyHours updates everywhere by itself;
// capacity[] lives inside each cached range and is patched here. A failure drops
// only this save's optimistic layer, so concurrent edits to other rows survive.
export function useUpdateWeeklyHours() {
  const client = useApolloClient()
  const [runMutation, { loading, error, reset }] = useMutation(UpdateWeeklyHoursDocument)

  async function mutate(person: Person, weeklyHours: number, onSuccess: () => void) {
    pendingSaves++
    try {
      await runMutation({
        variables: { id: person.id, weeklyHours },
        optimisticResponse: { updateWeeklyHours: { ...person, weeklyHours } },
        update(cache, { data }) {
          if (!data) return
          const { id, weeklyHours } = data.updateWeeklyHours
          cache.modify<{ capacity: CapacityQuery['capacity'] }>({
            fields: {
              capacity(existing, { readField }) {
                if (isReference(existing)) return existing
                return {
                  ...existing,
                  rows: existing.rows.map((r) =>
                    readField('id', r.person) === id ? { ...r, capacity: r.capacity.map(() => weeklyHours) } : r,
                  ),
                }
              },
            },
          })
        },
      })
      onSuccess()
    } catch {
      // Shown through `error`.
    } finally {
      if (--pendingSaves === 0) void client.refetchQueries({ include: [CapacityDocument] })
    }
  }

  return { mutate, isPending: loading, error, reset }
}

// The server's own message, so validation errors read the same as on the API.
export function errorMessage(error: ErrorLike): string {
  if (CombinedGraphQLErrors.is(error)) return error.errors[0]?.message ?? error.message
  if (ServerError.is(error) || ServerParseError.is(error)) return `Request failed (${error.statusCode})`
  return error.message
}

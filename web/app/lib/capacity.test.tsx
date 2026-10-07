import '@testing-library/jest-dom/vitest'
import { ApolloProvider } from '@apollo/client/react'
import { MantineProvider } from '@mantine/core'
import { act, cleanup, render, screen } from '@testing-library/react'
import { startTransition, Suspense, use, useState } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { makeClient } from '../apollo'
import { CapacityGrid } from '../components/CapacityGrid'

type Request = { from: string; aborted: boolean }
let requests: Request[]

beforeEach(() => {
  requests = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      const { from } = JSON.parse(String(init.body)).variables
      const request = { from, aborted: false }
      requests.push(request)
      init.signal?.addEventListener('abort', () => (request.aborted = true))
      const capacity = {
        __typename: 'CapacityRange',
        from,
        to: from,
        weeks: [from],
        rows: [
          {
            __typename: 'CapacityRow',
            person: { __typename: 'Person', id: '4', name: 'Dee Okafor', weeklyHours: 40 },
            allocated: [from === '2026-01-05' ? 45 : 10],
            capacity: [40],
          },
        ],
      }
      return new Response(JSON.stringify({ data: { capacity } }), { headers: { 'Content-Type': 'application/json' } })
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// Range changes come from router navigations, which React renders as transitions
// and may throw away. Here the transition suspends, so React keeps the old range
// committed while the new range's request is answered, as it did in the browser.
it('a range change React renders but does not commit yet sends no request for the old range', async () => {
  let release!: () => void
  const pending = new Promise<void>((resolve) => (release = resolve))
  let goTo!: (from: string) => void

  function Page() {
    const [from, setFrom] = useState('2026-01-05')
    goTo = (next) => startTransition(() => setFrom(next))
    return (
      <>
        {from !== '2026-01-05' && <Hold />}
        <CapacityGrid from={from} to={from} />
      </>
    )
  }
  function Hold() {
    use(pending)
    return null
  }

  render(
    <MantineProvider>
      <ApolloProvider client={makeClient()}>
        <Suspense>
          <Page />
        </Suspense>
      </ApolloProvider>
    </MantineProvider>,
  )
  expect(await screen.findByText('45 / 40')).toBeInTheDocument()

  goTo('2026-01-12')
  await new Promise((r) => setTimeout(r, 50))
  // Not committed yet, so nothing new is asked for, and the old range isn't refetched.
  expect(requests).toEqual([{ from: '2026-01-05', aborted: false }])
  await act(async () => release())

  expect(await screen.findByText('10 / 40')).toBeInTheDocument()
  expect(requests).toEqual([
    { from: '2026-01-05', aborted: false },
    { from: '2026-01-12', aborted: false },
  ])
})

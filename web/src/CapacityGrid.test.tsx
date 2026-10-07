import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CapacityGrid } from './CapacityGrid'

let weeklyHours: number
let patchResponse: () => Response

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  weeklyHours = 40
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') return patchResponse()
      return json({
        from: '2026-01-05',
        to: '2026-01-11',
        weeks: ['2026-01-05'],
        people: [{ id: 4, name: 'Dee Okafor', weekly_hours: weeklyHours, allocated: [45], capacity: [weeklyHours] }],
      })
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

async function editTo(value: string) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <CapacityGrid from="2026-01-05" to="2026-01-11" />
    </QueryClientProvider>,
  )
  expect(await screen.findByText('45 / 40')).toHaveClass('over')
  fireEvent.click(screen.getByRole('button', { name: '40' }))
  const input = screen.getByLabelText('Weekly hours for Dee Okafor')
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key: 'Enter' })
  return input
}

describe('editing weekly hours', () => {
  it('rolls back and keeps the typed value when the save fails', async () => {
    patchResponse = () => json({ error: 'weekly hours must be between 0 and 168' }, 422)
    const input = await editTo('200')
    expect(await screen.findByRole('alert')).toHaveTextContent('weekly hours must be between 0 and 168')
    expect(screen.getByText('45 / 40')).toHaveClass('over')
    expect(input).toHaveValue(200)
    expect(input).toHaveFocus()
    expect(input).not.toHaveAttribute('readonly')
  })

  it('after a failed save, blur sends nothing until the value is corrected', async () => {
    let patches = 0
    patchResponse = () => {
      patches++
      return json({ error: 'weekly hours must be between 0 and 168' }, 422)
    }
    const input = await editTo('200')
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    fireEvent.blur(input)
    await new Promise((r) => setTimeout(r, 0))
    expect(patches).toBe(1)
    expect(input).toHaveValue(200)

    patchResponse = () => {
      weeklyHours = 50
      return json({ id: 4, name: 'Dee Okafor', weekly_hours: 50 })
    }
    fireEvent.change(input, { target: { value: '50' } })
    fireEvent.blur(input)
    expect(await screen.findByText('45 / 50')).not.toHaveClass('over')
    expect(await screen.findByRole('button', { name: '50' })).toBeInTheDocument()
  })
})

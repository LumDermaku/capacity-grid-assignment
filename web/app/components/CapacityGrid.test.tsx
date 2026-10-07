import '@testing-library/jest-dom/vitest'
import { ApolloProvider } from '@apollo/client/react'
import { MantineProvider } from '@mantine/core'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeClient } from '../apollo'
import { CapacityGrid } from './CapacityGrid'

let weeklyHours: number
let extraRows: unknown[]
let mutationResponse: (vars: { id: string; weeklyHours: number }) => Response | Promise<Response>

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const person = () => ({ __typename: 'Person', id: '4', name: 'Dee Okafor', weeklyHours })

const rejected = () =>
  json({ errors: [{ message: 'weekly hours must be between 0 and 168', extensions: { code: 'BAD_USER_INPUT' } }] })

beforeEach(() => {
  weeklyHours = 40
  extraRows = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body))
      if (body.operationName === 'UpdateWeeklyHours') return mutationResponse(body.variables)
      return json({
        data: {
          capacity: {
            __typename: 'CapacityRange',
            from: '2026-01-05',
            to: '2026-01-11',
            weeks: ['2026-01-05'],
            rows: [{ __typename: 'CapacityRow', person: person(), allocated: [45], capacity: [weeklyHours] }, ...extraRows],
          },
        },
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
    <MantineProvider>
      <ApolloProvider client={makeClient()}>
        <CapacityGrid from="2026-01-05" to="2026-01-11" />
      </ApolloProvider>
    </MantineProvider>,
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
    mutationResponse = rejected
    const input = await editTo('200')
    expect(await screen.findByRole('alert')).toHaveTextContent('weekly hours must be between 0 and 168')
    expect(screen.getByText('45 / 40')).toHaveClass('over')
    expect(input).toHaveValue(200)
    expect(input).toHaveFocus()
    expect(input).not.toHaveAttribute('readonly')
  })

  it('after a failed save, blur sends nothing until the value is corrected', async () => {
    let mutations = 0
    mutationResponse = () => {
      mutations++
      return rejected()
    }
    const input = await editTo('200')
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    fireEvent.blur(input)
    await new Promise((r) => setTimeout(r, 0))
    expect(mutations).toBe(1)
    expect(input).toHaveValue(200)

    mutationResponse = () => {
      weeklyHours = 50
      return json({ data: { updateWeeklyHours: person() } })
    }
    fireEvent.change(input, { target: { value: '50' } })
    fireEvent.blur(input)
    expect(await screen.findByText('45 / 50')).not.toHaveClass('over')
    expect(await screen.findByRole('button', { name: '50' })).toBeInTheDocument()
  })

  it('a failed save rolls back only its own row, not a concurrent save', async () => {
    extraRows = [
      {
        __typename: 'CapacityRow',
        person: { __typename: 'Person', id: '5', name: 'Eli Nakamura', weeklyHours: 0 },
        allocated: [20],
        capacity: [0],
      },
    ]
    let finishDee!: () => void
    mutationResponse = ({ id }) =>
      id === '4'
        ? new Promise((resolve) => {
            finishDee = () => {
              weeklyHours = 50
              resolve(json({ data: { updateWeeklyHours: person() } }))
            }
          })
        : rejected()

    await editTo('50')
    expect(await screen.findByText('45 / 50')).not.toHaveClass('over')

    fireEvent.click(screen.getByRole('button', { name: '0' }))
    const eli = screen.getByLabelText('Weekly hours for Eli Nakamura')
    fireEvent.change(eli, { target: { value: '200' } })
    fireEvent.keyDown(eli, { key: 'Enter' })

    expect(await screen.findByRole('alert')).toHaveTextContent('weekly hours must be between 0 and 168')
    expect(screen.getByText('20 / 0')).toHaveClass('over')
    expect(screen.getByText('45 / 50')).not.toHaveClass('over')

    finishDee()
    expect(await screen.findByRole('button', { name: '50' })).toBeInTheDocument()
    expect(screen.getByText('45 / 50')).not.toHaveClass('over')
  })
})

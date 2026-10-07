import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import { ApolloProvider } from '@apollo/client/react'
import { Alert, Box, ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import type { ReactNode } from 'react'
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import type { Route } from './+types/root'
import { makeClient } from './apollo'
import { GridSkeleton } from './components/CapacityGrid'
import { CapacityPage, defaultRange } from './routes/capacity'
import { theme } from './theme'
import './styles.css'

const client = makeClient()

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <title>Capacity</title>
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <ApolloProvider client={client}>{children}</ApolloProvider>
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

// First paint in SPA mode: the same chrome and skeleton as the first load.
export function HydrateFallback() {
  return (
    <CapacityPage range={defaultRange()} setRange={() => {}}>
      <GridSkeleton />
    </CapacityPage>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Unknown error'
  return (
    <Box component="main" p="xl">
      <Alert color="coral" variant="light" title="Something went wrong">
        {message}
      </Alert>
    </Box>
  )
}

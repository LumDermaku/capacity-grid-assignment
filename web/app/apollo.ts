import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { RetryLink } from '@apollo/client/link/retry'
import { OperationTypeNode } from 'graphql'

export function makeClient() {
  return new ApolloClient({
    link: ApolloLink.from([
      // A failed load is retried once; a mutation never is.
      new RetryLink({
        delay: { initial: 1000, jitter: false },
        attempts: { max: 2, retryIf: (_error, operation) => operation.operationType === OperationTypeNode.QUERY },
      }),
      // Resolve fetch per request so tests can stub it.
      new HttpLink({ uri: '/api/graphql', fetch: (...args) => fetch(...args) }),
    ]),
    cache: new InMemoryCache(),
  })
}

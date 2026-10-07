import { GraphQLError } from 'graphql';

export function badInput(message: string) {
    return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });
}

export function notFound(message: string) {
    return new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });
}

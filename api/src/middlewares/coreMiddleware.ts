import { createYoga, maskError } from 'graphql-yoga';
import { sql } from '../db';
import { YOGA_ENDPOINT } from '../lib/constants';
import type { ApiContext } from '../lib/context';
import { logger } from '../lib/logger';
import type { Middleware } from '../lib/middlewarePipeline';
import { getSchema } from '../lib/schema';

const yoga = createYoga<object, ApiContext>({
    schema: getSchema(),
    graphqlEndpoint: YOGA_ENDPOINT,
    logging: {
        debug: () => {},
        info: (...args) => logger.info(args),
        warn: (...args) => logger.warn(args),
        error: (...args) => logger.error(args),
    },
    // Errors we throw on purpose (GraphQLError) pass through; anything else is
    // logged and reaches the client as "internal error", so database details stay out of the UI.
    maskedErrors: {
        maskError(error) {
            // Never dev mode: the original error goes to the log, not the response.
            const masked = maskError(error, 'internal error', false);
            if (masked !== error) {
                const original = error instanceof Error && 'originalError' in error ? error.originalError : error;
                logger.error({ err: original ?? error }, 'Unexpected error');
            }
            return masked;
        },
    },
    context: () => ({ sql, log: logger }),
    graphiql: process.env.NODE_ENV !== 'production',
});

const coreMiddleware: Middleware = (req) => Promise.resolve(yoga.fetch(req));

export default coreMiddleware;

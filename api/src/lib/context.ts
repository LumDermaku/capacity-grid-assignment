import type { SQL } from 'bun';
import type { YogaInitialContext } from 'graphql-yoga';
import type { Logger } from './logger';

// What we add on top of Yoga's own context.
export type ApiContext = {
    sql: SQL;
    log: Logger;
};

// Referenced by codegen, so resolvers get a fully typed ctx.
export type GraphQLContext = YogaInitialContext & ApiContext;

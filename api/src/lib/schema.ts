import { makeExecutableSchema } from '@graphql-tools/schema';
import { getResolvers } from './resolvers';
import { getTypeDefs } from './typeDefs';

export function getSchema() {
    return makeExecutableSchema({ typeDefs: getTypeDefs(), resolvers: getResolvers() });
}

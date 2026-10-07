import { GraphQLScalarType, Kind } from 'graphql';
import type { Resolvers } from '../../generated/graphql';
import { isIsoDate, weekRange } from '../../lib/dates';
import { badInput } from '../../lib/errors';
import { foldRows, queryCapacity } from './capacityRows';

function parseDate(value: unknown): string {
    if (typeof value !== 'string' || !isIsoDate(value)) {
        throw badInput('must be a date (YYYY-MM-DD)');
    }
    return value;
}

const DateScalar = new GraphQLScalarType<string, string>({
    name: 'Date',
    description: 'Calendar date as YYYY-MM-DD.',
    serialize: (value) => parseDate(value),
    parseValue: parseDate,
    parseLiteral: (ast) => parseDate(ast.kind === Kind.STRING ? ast.value : undefined),
});

export const capacityResolvers: Resolvers = {
    Date: DateScalar,
    Query: {
        capacity: async (_parent, { from, to }, { sql }) => {
            const range = weekRange(from, to);
            const rows = await queryCapacity(sql, range.from, range.to);
            return { ...range, rows: foldRows(rows) };
        },
    },
};

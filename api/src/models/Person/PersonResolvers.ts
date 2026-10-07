import type { Resolvers } from '../../generated/graphql';
import { badInput, notFound } from '../../lib/errors';
import { toPerson } from './person';

const MAX_WEEKLY_HOURS = 168;

export const personResolvers: Resolvers = {
    Mutation: {
        updateWeeklyHours: async (_parent, { id, weeklyHours }, { sql }) => {
            if (!/^[+-]?\d+$/.test(id) || !Number.isSafeInteger(Number(id))) throw badInput('id must be an integer');
            if (weeklyHours < 0 || weeklyHours > MAX_WEEKLY_HOURS) {
                throw badInput(`weekly hours must be between 0 and ${MAX_WEEKLY_HOURS}`);
            }
            const [person] = await sql`
                UPDATE people SET weekly_hours = ${weeklyHours} WHERE id = ${Number(id)}
                RETURNING id, name, weekly_hours::float8 AS weekly_hours`;
            if (!person) throw notFound('person not found');
            return toPerson(person);
        },
    },
};

import { describe, expect, it } from 'bun:test';
import coreMiddleware from '../../middlewares/coreMiddleware';

// Runs against the seeded database: `docker compose exec api bun test`.
describe.skipIf(!process.env.DATABASE_URL)('capacity query (seeded DB)', () => {
    it('Dee Okafor, week of 2026-01-05: 45h allocated against 40h', async () => {
        const res = await coreMiddleware(
            new Request('http://api/api/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: '{ capacity(from: "2026-01-05", to: "2026-01-11") { weeks rows { person { name } allocated capacity } } }',
                }),
            }),
            () => Promise.reject(new Error('unreachable')),
        );
        const { data } = await res.json();
        const dee = data.capacity.rows.find((r: { person: { name: string } }) => r.person.name === 'Dee Okafor');
        expect(data.capacity.weeks).toEqual(['2026-01-05']);
        expect(dee).toEqual({ person: { name: 'Dee Okafor' }, allocated: [45], capacity: [40] });
    });
});

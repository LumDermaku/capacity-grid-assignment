import { SQL } from 'bun';
import { logger } from './lib/logger';

export const sql = new SQL(process.env.DATABASE_URL ?? 'postgres://capacity:capacity@localhost:5432/capacity?sslmode=disable');

// Compose starts the API once Postgres reports healthy, but keep retrying for
// a while in case it is still accepting its first connections.
export async function waitForDb(tries = 30) {
    for (let i = 1; ; i++) {
        try {
            await sql`SELECT 1`;
            return;
        } catch (err) {
            if (i >= tries) throw err;
            logger.warn({ err }, `Database not ready (attempt ${i}/${tries})`);
            await Bun.sleep(1000);
        }
    }
}

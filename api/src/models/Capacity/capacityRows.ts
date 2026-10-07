import type { SQL } from 'bun';
import type { CapacityRow } from '../../generated/graphql';
import { toPerson, type PersonRow } from '../Person/person';

type DbRow = PersonRow & { allocated: number };

// Rows that look like duplicates are additive: summed, they give whole hours
// per day, so they must not be deduplicated. Weekends never count.
export function queryCapacity(sql: SQL, from: string, to: string): Promise<DbRow[]> {
    return sql`
        WITH weeks AS (
            SELECT generate_series(${from}::date, ${to}::date, interval '7 days')::date AS week_start
        ),
        alloc AS (
            SELECT a.person_id, date_trunc('week', d)::date AS week_start, sum(a.hours_per_day) AS hours
            FROM assignments a
            CROSS JOIN generate_series(greatest(a.start_date, ${from}::date), least(a.end_date, ${to}::date), interval '1 day') AS d
            WHERE a.start_date <= ${to}::date AND a.end_date >= ${from}::date AND extract(isodow FROM d) < 6
            GROUP BY 1, 2
        )
        SELECT p.id, p.name, p.weekly_hours::float8 AS weekly_hours, round(coalesce(alloc.hours, 0), 2)::float8 AS allocated
        FROM people p
        CROSS JOIN weeks w
        LEFT JOIN alloc ON alloc.person_id = p.id AND alloc.week_start = w.week_start
        ORDER BY p.name, p.id, w.week_start`;
}

// Rows arrive ordered by person then week, so each person's rows are contiguous.
export function foldRows(rows: DbRow[]): CapacityRow[] {
    const out: CapacityRow[] = [];
    let current: CapacityRow | undefined;
    let currentId: number | undefined;
    for (const r of rows) {
        if (!current || currentId !== r.id) {
            current = { person: toPerson(r), allocated: [], capacity: [] };
            currentId = r.id;
            out.push(current);
        }
        current.allocated.push(r.allocated);
        current.capacity.push(r.weekly_hours);
    }
    return out;
}

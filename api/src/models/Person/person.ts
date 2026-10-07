import type { Person } from '../../generated/graphql';

export type PersonRow = { id: number; name: string; weekly_hours: number };

export function toPerson(row: PersonRow): Person {
    return { id: String(row.id), name: row.name, weeklyHours: row.weekly_hours };
}

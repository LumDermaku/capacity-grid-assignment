import { badInput } from './errors';

const DAY_MS = 86_400_000;

export const MAX_WEEKS = 26;

function parse(iso: string): Date {
    return new Date(`${iso}T00:00:00Z`);
}

function format(d: Date): string {
    return d.toISOString().slice(0, 10);
}

export function isIsoDate(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parse(s).getTime()) && format(parse(s)) === s;
}

export function addDays(iso: string, days: number): string {
    return format(new Date(parse(iso).getTime() + days * DAY_MS));
}

export function mondayOf(iso: string): string {
    return addDays(iso, -((parse(iso).getUTCDay() + 6) % 7));
}

export type WeekRange = { from: string; to: string; weeks: string[] };

// Widens [from, to] to whole ISO weeks (Monday to Sunday), at most MAX_WEEKS.
export function weekRange(from: string, to: string): WeekRange {
    if (to < from) throw badInput('from must not be after to');
    const monday = mondayOf(from);
    const sunday = addDays(mondayOf(to), 6);
    if (addDays(sunday, 1) > addDays(monday, MAX_WEEKS * 7)) {
        throw badInput(`range is limited to ${MAX_WEEKS} weeks`);
    }
    const weeks: string[] = [];
    for (let w = monday; w < sunday; w = addDays(w, 7)) weeks.push(w);
    return { from: monday, to: sunday, weeks };
}

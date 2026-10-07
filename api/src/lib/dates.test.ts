import { describe, expect, it } from 'bun:test';
import { isIsoDate, mondayOf, weekRange } from './dates';

describe('mondayOf', () => {
    it('returns the Monday of the ISO week', () => {
        expect(mondayOf('2026-01-05')).toBe('2026-01-05');
        expect(mondayOf('2026-01-11')).toBe('2026-01-05');
        expect(mondayOf('2026-03-01')).toBe('2026-02-23');
    });
});

describe('weekRange', () => {
    it('widens to whole ISO weeks and lists each Monday', () => {
        expect(weekRange('2026-01-07', '2026-01-13')).toEqual({
            from: '2026-01-05',
            to: '2026-01-18',
            weeks: ['2026-01-05', '2026-01-12'],
        });
    });

    it('allows exactly 26 weeks and rejects 27', () => {
        expect(weekRange('2026-01-05', '2026-07-05').weeks).toHaveLength(26);
        expect(() => weekRange('2026-01-05', '2026-07-06')).toThrow('range is limited to 26 weeks');
    });

    it('rejects from after to, even within the same week', () => {
        expect(() => weekRange('2026-01-07', '2026-01-06')).toThrow('from must not be after to');
    });
});

describe('isIsoDate', () => {
    it('accepts real YYYY-MM-DD dates only', () => {
        expect(isIsoDate('2026-01-05')).toBe(true);
        expect(isIsoDate('2026-02-30')).toBe(false);
        expect(isIsoDate('2026-1-5')).toBe(false);
        expect(isIsoDate('2026-01-05T00:00:00Z')).toBe(false);
    });
});

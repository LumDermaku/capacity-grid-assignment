import { expect, it } from 'bun:test';
import { foldRows } from './capacityRows';

it('folds person × week rows into one row per person, index-aligned with weeks', () => {
    const rows = [
        { id: 4, name: 'Dee Okafor', weekly_hours: 40, allocated: 45 },
        { id: 4, name: 'Dee Okafor', weekly_hours: 40, allocated: 0 },
        { id: 5, name: 'Eli Nakamura', weekly_hours: 0, allocated: 20 },
        { id: 5, name: 'Eli Nakamura', weekly_hours: 0, allocated: 0 },
    ];

    expect(foldRows(rows)).toEqual([
        { person: { id: '4', name: 'Dee Okafor', weeklyHours: 40 }, allocated: [45, 0], capacity: [40, 40] },
        { person: { id: '5', name: 'Eli Nakamura', weeklyHours: 0 }, allocated: [20, 0], capacity: [0, 0] },
    ]);
});

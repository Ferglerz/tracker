import { describe, expect, it } from 'vitest';
import { HabitCSVService } from './ImportCSV';

describe('HabitCSVService', () => {
  it('round-trips quantity headers and normalizes dates', async () => {
    const file = new File(
      ['Date,Water (glasses)\n2026-8-2,7\n'],
      'habits.csv',
      { type: 'text/csv' },
    );

    await expect(HabitCSVService.parseCSVFile(file)).resolves.toEqual([
      {
        name: 'Water',
        unit: 'glasses',
        type: 'quantity',
        values: [{ date: '2026-08-02', value: { quantity: 7, goal: 0 } }],
      },
    ]);
  });

  it('reports invalid values with row context', async () => {
    const file = new File(
      ['Date,Water (glasses)\n2026-08-02,not-a-number\n'],
      'habits.csv',
      { type: 'text/csv' },
    );

    await expect(HabitCSVService.parseCSVFile(file))
      .rejects.toThrow('Invalid value for "Water" on CSV row 2');
  });

  it('rejects oversized imports before parsing', async () => {
    const file = new File(['Date,Habit\n'], 'large.csv');
    Object.defineProperty(file, 'size', {
      value: HabitCSVService.MAX_IMPORT_BYTES + 1,
    });

    await expect(HabitCSVService.parseCSVFile(file)).rejects.toThrow('exceeds 5 MB limit');
  });
});

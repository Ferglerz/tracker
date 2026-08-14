import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Habit } from './TypesAndProps';

const { handleHabitData } = vi.hoisted(() => ({ handleHabitData: vi.fn() }));
vi.mock('./Storage', () => ({
  HabitStorageWrapper: {
    handleHabitData,
    refreshWidgets: vi.fn(),
  },
}));

import { HabitEntity } from './HabitEntity';

const makeHabit = (overrides: Partial<Habit.Habit> = {}): Habit.Habit => ({
  id: 'habit-1',
  name: 'Read',
  type: 'quantity',
  goal: 10,
  bgColor: '#fff',
  quantity: 0,
  history: {},
  ...overrides,
});

describe('HabitEntity', () => {
  beforeEach(() => handleHabitData.mockReset());

  it('whitelists updates and uses fresh stored history', async () => {
    const stored = makeHabit({
      history: { '2026-08-13': { quantity: 4, goal: 10, note: 'fresh' } },
    });
    const data = { habits: [stored] };
    handleHabitData.mockResolvedValueOnce(data).mockResolvedValueOnce(data);
    const entity = new HabitEntity(makeHabit());

    await entity.update({
      dateString: '2026-08-13',
      quantity: 5,
      widget: { assignments: [{ type: 'small1', order: 1 }] },
      history: {
        '2026-08-13': { quantity: 5, goal: 10, note: undefined },
      },
    });

    expect(data.habits[0]).not.toHaveProperty('dateString');
    expect(data.habits[0]).not.toHaveProperty('widget');
    expect(data.habits[0].widgets?.assignments).toHaveLength(1);
    expect(data.habits[0].history['2026-08-13'].note).toBe('fresh');
  });

  it('returns and emits the entity that was actually stored', async () => {
    const data: Habit.Data = { habits: [] };
    handleHabitData.mockResolvedValueOnce(data).mockResolvedValueOnce(data);
    const emissions: Habit.Habit[][] = [];
    const subscription = HabitEntity.getHabits$().subscribe(value => emissions.push(value));

    const created = await HabitEntity.create(makeHabit({ id: '', listOrder: undefined }));

    expect(created.id).not.toBe('');
    expect(created.id).toBe(data.habits[0].id);
    expect(emissions.at(-1)?.[0].id).toBe(created.id);
    subscription.unsubscribe();
  });
});

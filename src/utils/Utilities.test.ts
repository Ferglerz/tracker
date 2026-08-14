import { describe, expect, it } from 'vitest';
import { HabitEntity } from './HabitEntity';
import { calculateStreaks } from './Utilities';
import type { Habit } from './TypesAndProps';

function weeklyHabit(history: Habit.Habit['history']): HabitEntity {
  return new HabitEntity({
    id: 'weekly',
    name: 'Exercise',
    type: 'quantity',
    goal: 3,
    bgColor: '#fff',
    quantity: 0,
    history,
    frequency: 'weekly',
  });
}

describe('calculateStreaks', () => {
  it('counts completed weekly periods instead of individual days', () => {
    const habit = weeklyHabit({
      '2026-07-27': { quantity: 1, goal: 3 },
      '2026-07-29': { quantity: 2, goal: 3 },
      '2026-08-04': { quantity: 3, goal: 3 },
    });

    expect(calculateStreaks(habit, new Date(2026, 7, 12))).toEqual({
      currentStreak: 2,
      longestStreak: 2,
    });
  });

  it('breaks a weekly streak on an incomplete prior period', () => {
    const habit = weeklyHabit({
      '2026-07-27': { quantity: 3, goal: 3 },
      '2026-08-04': { quantity: 2, goal: 3 },
      '2026-08-11': { quantity: 3, goal: 3 },
    });

    expect(calculateStreaks(habit, new Date(2026, 7, 12))).toEqual({
      currentStreak: 1,
      longestStreak: 1,
    });
  });
});

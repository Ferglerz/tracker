import type { Habit } from './HabitStorage';

export type UpdateAction = 
  | { type: 'quantity'; delta: number }
  | { type: 'checkbox'; checked: boolean };

export type HabitFormData = Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>;

// Add any other shared types here as needed
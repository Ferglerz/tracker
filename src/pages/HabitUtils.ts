// habitUtils.ts

import { format } from 'date-fns';
import type { Habit } from './HabitStorage';

export const formatDateKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const getStatusColor = (status: 'complete' | 'partial' | 'none'): string => {
  switch (status) {
    case 'complete':
      return '#2dd36f';
    case 'partial':
      return '#ffc409';
    case 'none':
      return 'transparent';
  }
};

export const getHabitStatus = (
  value: number | boolean | undefined,
  habit: Habit
): 'complete' | 'partial' | 'none' => {
  if (value === undefined) return 'none';
  
  if (typeof value === 'boolean') {
    return value ? 'complete' : 'none';
  }
  
  if (habit.goal) {
    if (value >= habit.goal) return 'complete';
    if (value > 0) return 'partial';
  }
  
  return value > 0 ? 'complete' : 'none';
};

export const getHighlightStyle = (value: number | boolean | undefined, habit: Habit) => {
  const status = getHabitStatus(value, habit);
  
  return {
    textColor: status === 'none' ? '#000000' : '#ffffff',
    backgroundColor: getStatusColor(status)
  };
};

export const validateHabitData = (data: unknown): data is Required<Habit> => {
  if (!data || typeof data !== 'object') return false;
  
  const habit = data as Partial<Habit>;
  return !!(
    habit.id &&
    habit.name &&
    habit.type &&
    typeof habit.quantity === 'number' &&
    typeof habit.isChecked === 'boolean' &&
    typeof habit.isComplete === 'boolean' &&
    typeof habit.isBegun === 'boolean'
  );
};

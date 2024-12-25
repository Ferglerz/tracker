// HabitUtils.ts
import { format } from 'date-fns';
import { HabitEntity } from './HabitEntity';
import { errorHandler } from './ErrorUtils';
import { Habit } from './HabitTypes';

export const formatDateKey = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    errorHandler.handleError(error, 'Failed to format date');
    return '';
  }
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
  habit: HabitEntity
): 'complete' | 'partial' | 'none' => {
  try {
    if (value === undefined) return 'none';
    
    if (habit.type === 'checkbox') {
      return value ? 'complete' : 'none';
    }
    
    const goal = habit.goal;
    if (typeof value === 'number') {
      if (goal) {
        if (value >= goal) return 'complete';
        if (value > 0) return 'partial';
      } else {
        return value > 0 ? 'complete' : 'none';
      }
    }
    
    return 'none';
  } catch (error) {
    errorHandler.handleError(error, 'Failed to get habit status');
    return 'none';
  }
};
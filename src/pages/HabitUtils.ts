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
  value: [number, number] | boolean | undefined,
  habit: HabitEntity
): 'complete' | 'partial' | 'none' => {
  try {
    if (value === undefined) return 'none';
    
    if (habit.type === 'checkbox') {
      // For checkbox type, value should be boolean
      return (value as boolean) ? 'complete' : 'none';
    }
    
    // For quantity type, value is now [quantity, goal]
    if (Array.isArray(value)) {
      const [quantity, goal] = value;
      if (goal > 0) {
        if (quantity >= goal) return 'complete';
        if (quantity > 0) return 'partial';
      } else {
        return quantity > 0 ? 'complete' : 'none';
      }
    }
    
    return 'none';
  } catch (error) {
    errorHandler.handleError(error, 'Failed to get habit status');
    return 'none';
  }
};
import { format } from 'date-fns';
import { HabitEntity } from './HabitEntity';
import { errorHandler } from './ErrorUtilities';

export const formatDateKey = (date: Date): string => {
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    errorHandler.handleError(error, 'Failed to format date');
    return '';
  }
};

// Add to Utilities.ts

export const getLast28Days = (habit: HabitEntity): Array<{date: string, value: number | boolean}> => {
  const dates: Array<{date: string, value: number | boolean}> = [];
  const today = new Date();
  
  for (let i = 27; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateKey = formatDateKey(date);
    const value = habit.history[dateKey];
    
    if (habit.type === 'checkbox') {
      dates.push({
        date: dateKey,
        value: value === true
      });
    } else {
      dates.push({
        date: dateKey,
        value: Array.isArray(value) ? value[0] : 0
      });
    }
  }
  
  return dates;
};

// Helper function to get the date key for a given ISO string
export const getDateKey = (isoString: string): string | undefined => {
    const date = new Date(isoString);
    date.setHours(0, 0, 0, 0);
    if (isNaN(date.getTime())) {
        errorHandler.handleError(new Error('Invalid date'), 'Invalid date selected');
        return undefined;
    }
    return formatDateKey(date);
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
import { format } from 'date-fns';
import { HabitEntity } from './HabitEntity';
import { errorHandler } from './ErrorUtilities';
import { Habit } from './Types';

export const formatDateKey = (date: Date): string => {
  try {
      // Ensure we're working with a local date
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return format(localDate, 'yyyy-MM-dd');
  } catch (error) {
      errorHandler.handleError(error, 'Failed to format date');
      return '';
  }
};

export const getLast56Days = (habit: HabitEntity): Array<{date: string, value: [number, number] | boolean}> => {
  const dates: Array<{date: string, value: [number, number] | boolean}> = [];
  const today = new Date();
  
  for (let i = 55; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateKey = formatDateKey(date);
      const historyValue = habit.history[dateKey];
      
      if (habit.type === 'checkbox') {
          dates.push({
              date: dateKey,
              value: historyValue?.isChecked ?? false
          });
      } else {
          dates.push({
              date: dateKey,
              value: historyValue ? 
                  [historyValue.quantity, historyValue.goal] : 
                  [0, habit.goal || 0]
          });
      }
  }
  
  return dates;
};

// Helper function to get the date key for a given ISO string
export const getDateKey = (isoString: string): string | undefined => {
  try {
    const date = new Date(isoString);
    
    // Get UTC components
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    
    // Create date in local timezone using UTC components
    const localDate = new Date(year, month, day);
    
    if (isNaN(localDate.getTime())) {
      errorHandler.handleError(new Error('Invalid date'), 'Invalid date selected');
      return undefined;
    }
    return formatDateKey(localDate);
  } catch (error) {
    errorHandler.handleError(error, 'Failed to get date key');
    return undefined;
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
  value: Habit.HistoryEntry | undefined,
  habit: HabitEntity
): 'complete' | 'partial' | 'none' => {
  try {
      if (!value) return 'none';
      
      if (habit.type === 'checkbox') {
          return value.isChecked ? 'complete' : 'none';
      }
      
      // For quantity type
      if (value.goal > 0) {
          if (value.quantity >= value.goal) return 'complete';
          if (value.quantity > 0) return 'partial';
      } else {
          return value.quantity > 0 ? 'complete' : 'none';
      }
      
      return 'none';
  } catch (error) {
      errorHandler.handleError(error, 'Failed to get habit status');
      return 'none';
  }
};
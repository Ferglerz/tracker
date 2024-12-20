// HabitUtils.ts
import { format } from 'date-fns';
import { HabitEntity } from './HabitEntity';
import { Habit } from './HabitTypes';
import { errorHandler } from './ErrorUtils';

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

export const getHighlightStyle = (value: number | boolean | undefined, habit: HabitEntity) => {
  try {
    const status = getHabitStatus(value, habit);
    return {
      textColor: status === 'none' ? '#000000' : '#ffffff',
      backgroundColor: getStatusColor(status)
    };
  } catch (error) {
    errorHandler.handleError(error, 'Failed to get highlight style');
    return {
      textColor: '#000000',
      backgroundColor: 'transparent'
    };
  }
};

export const calculateStreak = async (habit: HabitEntity, endDate: Date = new Date()): Promise<number> => {
  try {
    let currentStreak = 0;
    const currentDate = new Date(endDate);

    while (true) {
      const status = habit.getStatusForDate(currentDate);
      if (status === 'complete') {
        currentStreak++;
      } else {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return currentStreak;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to calculate streak');
    return 0;
  }
};

export const calculateCompletion = (habit: HabitEntity, startDate: Date, endDate: Date) => {
  try {
    let total = 0;
    let completed = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const value = habit.getValueForDate(currentDate);
      if (value !== undefined) {
        total++;
        if (getHabitStatus(value, habit) === 'complete') {
          completed++;
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      total,
      completed,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  } catch (error) {
    errorHandler.handleError(error, 'Failed to calculate completion');
    return {
      total: 0,
      completed: 0,
      percentage: 0
    };
  }
};

export const formatHabitValue = (habit: HabitEntity, value?: number | boolean): string => {
  try {
    if (value === undefined) return '-';
    
    if (habit.type === 'checkbox') {
      return value ? '✓' : '✗';
    }
    
    if (typeof value === 'number') {
      return `${value}${habit.unit ? ` ${habit.unit}` : ''}`;
    }
    
    return '-';
  } catch (error) {
    errorHandler.handleError(error, 'Failed to format habit value');
    return '-';
  }
};

export const generateHabitSummary = async (habit: HabitEntity): Promise<string> => {
  try {
    const streak = await calculateStreak(habit);
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const completion = calculateCompletion(habit, startOfMonth, today);

    return `${habit.name}: ${streak} day streak, ${completion.percentage.toFixed(1)}% completion this month`;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to generate habit summary');
    return `${habit.name}: Error calculating summary`;
  }
};

export const validateHabitData = (data: unknown): data is Habit.Base => {
  try {
    if (!data || typeof data !== 'object') return false;
    
    const habitData = data as Partial<Habit.Base>;
    const isValid = !!(
      habitData.id &&
      habitData.name &&
      habitData.type &&
      habitData.bgColor
    );

    // Additional type validation
    if (isValid) {
      if (habitData.type !== 'checkbox' && habitData.type !== 'quantity') {
        return false;
      }
      if (habitData.goal !== undefined && typeof habitData.goal !== 'number') {
        return false;
      }
      if (habitData.unit !== undefined && typeof habitData.unit !== 'string') {
        return false;
      }
    }

    return isValid;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to validate habit data');
    return false;
  }
};
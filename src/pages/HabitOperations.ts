// HabitOperations.ts
import { HabitEntity } from './HabitEntity';
import { Habit } from './HabitTypes';
import { errorHandler } from './ErrorUtils';
import { formatDateKey } from './HabitUtils';

export const getHabitStats = async (
  habit: HabitEntity, 
  startDate: Date, 
  endDate: Date
): Promise<Habit.Stats> => {
  try {
    // Input validation
    if (endDate < startDate) {
      throw new Error('End date cannot be before start date');
    }

    const history = await habit.getAllHistory();
    const stats: Habit.Stats = {
      totalDays: 0,
      completedDays: 0,
      partialDays: 0,
      streak: 0,
      longestStreak: 0,
      averageValue: 0,
    };

    let currentDate = new Date(startDate);
    let totalValue = 0;
    let currentStreak = 0;

    while (currentDate <= endDate) {
      const dateKey = formatDateKey(currentDate);
      const value = history[dateKey];
      
      if (value !== undefined) {
        stats.totalDays++;
        const status = habit.getStatusForDate(currentDate);
        
        switch (status) {
          case 'complete':
            stats.completedDays++;
            currentStreak++;
            stats.longestStreak = Math.max(stats.longestStreak, currentStreak);
            break;
          case 'partial':
            stats.partialDays++;
            currentStreak = 0;
            break;
          default:
            currentStreak = 0;
        }

        if (typeof value === 'number') {
          totalValue += value;
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Final calculations
    stats.streak = currentStreak;
    stats.averageValue = habit.type === 'quantity' && stats.totalDays > 0
      ? totalValue / stats.totalDays
      : 0;

    return stats;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to calculate habit statistics');
    // Return default stats in case of error
    return {
      totalDays: 0,
      completedDays: 0,
      partialDays: 0,
      streak: 0,
      longestStreak: 0,
      averageValue: 0,
    };
  }
};

export const analyzeHabitTrends = async (
  habit: HabitEntity,
  startDate: Date,
  endDate: Date
) => {
  try {
    const history = await habit.getAllHistory();
    const dailyValues: { date: string; value: number }[] = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = formatDateKey(currentDate);
      const value = history[dateKey];
      
      if (value !== undefined) {
        dailyValues.push({
          date: dateKey,
          value: typeof value === 'number' ? value : (value ? 1 : 0)
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate basic trend analysis
    const sortedValues = dailyValues.sort((a, b) => a.value - b.value);
    const totalValues = dailyValues.length;
    
    return {
      min: sortedValues[0]?.value ?? 0,
      max: sortedValues[totalValues - 1]?.value ?? 0,
      median: sortedValues[Math.floor(totalValues / 2)]?.value ?? 0,
      average: totalValues > 0
        ? dailyValues.reduce((sum, { value }) => sum + value, 0) / totalValues
        : 0,
      totalEntries: totalValues,
      dailyValues
    };
  } catch (error) {
    errorHandler.handleError(error, 'Failed to analyze habit trends');
    throw error;
  }
};

export const calculateProgress = (habit: HabitEntity): number => {
  try {
    if (habit.type === 'checkbox') {
      return habit.isChecked ? 100 : 0;
    }
    
    if (habit.type === 'quantity' && habit.goal) {
      return Math.min(100, (habit.quantity / habit.goal) * 100);
    }
    
    return habit.isComplete ? 100 : 0;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to calculate habit progress');
    return 0;
  }
};
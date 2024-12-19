// HabitOperations.ts
import { HabitModel } from './HabitModel';
import { errorHandler } from './ErrorUtils';
import { formatDateKey } from './HabitUtils';

export const duplicateHabit = async (sourceHabit: HabitModel): Promise<HabitModel> => {
  try {
    const props = sourceHabit.toJSON();
    const newProps = {
      ...props,
      id: Date.now().toString(),
      name: `${props.name} (Copy)`,
    };
    
    return await HabitModel.create(newProps);
  } catch (error) {
    errorHandler.handleError(error, 'Failed to duplicate habit');
    throw error;
  }
};

export const getHabitStats = async (habit: HabitModel, startDate: Date, endDate: Date) => {
  try {
    const history = await habit.getAllHistory();
    const stats = {
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
        
        if (status === 'complete') {
          stats.completedDays++;
          currentStreak++;
          stats.longestStreak = Math.max(stats.longestStreak, currentStreak);
        } else if (status === 'partial') {
          stats.partialDays++;
          currentStreak = 0;
        } else {
          currentStreak = 0;
        }

        if (typeof value === 'number') {
          totalValue += value;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    stats.streak = currentStreak;
    stats.averageValue = stats.totalDays ? totalValue / stats.totalDays : 0;

    return stats;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to calculate habit statistics');
    throw error;
  }
};
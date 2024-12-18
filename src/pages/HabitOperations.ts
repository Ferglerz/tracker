// HabitOperations.ts
import { format } from 'date-fns';
import { errorHandler } from './ErrorUtils';
import { HabitModel } from './HabitModel';
import { formatDateKey } from './HabitUtils';

export const exportHabitHistoryToCSV = async (habits: HabitModel[]): Promise<void> => {
  try {
    if (!habits.length) {
      throw new Error('No habits available to export');
    }

    // Get all unique dates across all habits
    const allDates = new Set<string>();
    for (const habit of habits) {
      const dates = Object.keys(await habit.getAllHistory());
      dates.forEach(date => allDates.add(date));
    }

    const sortedDates = Array.from(allDates).sort();
    
    if (!sortedDates.length) {
      throw new Error('No dates found in history');
    }

    // Create headers with habit names and units
    const headers = ['Date', ...habits.map(h => {
      const name = h.name.includes(',') ? `"${h.name}"` : h.name;
      return `${name}${h.unit ? ` (${h.unit})` : ''}`;
    })];

    // Create CSV rows
    const csvRows = [headers.join(',')];
    
    for (const date of sortedDates) {
      const row = [date];
      for (const habit of habits) {
        const value = habit.getValueForDate(new Date(date));
        row.push(typeof value === 'boolean' ? (value ? '1' : '0') : 
                typeof value === 'number' ? value.toString() : '');
      }
      csvRows.push(row.join(','));
    }

    // Add BOM for proper UTF-8 encoding
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    // Create and trigger download
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = `habit-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
  } catch (error) {
    errorHandler.handleError(error, 'Failed to export habit history');
    throw error;
  }
};
export const importHabitsFromCSV = async (file: File): Promise<void> => {
  try {
    const text = await file.text();
    const [headerRow, ...dataRows] = text
      .trim()
      .split('\n')
      .map(row => row.split(','));

    // Parse headers to get habit names and units
    const habitColumns = headerRow.slice(1).map(header => {
      const match = header.match(/^"?([^"]+)"?(?:\s*\(([^)]+)\))?$/);
      return {
        name: match?.[1] || header,
        unit: match?.[2],
      };
    });

    // Create habit models for each column
    const habits: HabitModel[] = [];
    for (const { name, unit } of habitColumns) {
      const habitProps = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        type: unit ? 'quantity' as const : 'checkbox' as const,
        unit,
        bgColor: '#b5ead7', // Default color
      };
      
      const habit = await HabitModel.create(habitProps);
      habits.push(habit);
    }

    // Import data for each habit
    for (const row of dataRows) {
      const date = new Date(row[0]);
      if (isNaN(date.getTime())) continue;

      for (let i = 0; i < habits.length; i++) {
        const value = row[i + 1];
        const habit = habits[i];

        if (value && habit) {
          if (habit.type === 'checkbox') {
            await habit.setChecked(value === '1', date);
          } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              await habit.setValue(numValue, date);
            }
          }
        }
      }
    }

    errorHandler.showInfo('Import completed successfully');
  } catch (error) {
    errorHandler.handleError(error, 'Failed to import habits');
    throw error;
  }
};

export const bulkDeleteHabits = async (habitIds: string[]): Promise<void> => {
  try {
    for (const id of habitIds) {
      await HabitModel.delete(id);
    }
    errorHandler.showInfo(`Successfully deleted ${habitIds.length} habits`);
  } catch (error) {
    errorHandler.handleError(error, 'Failed to delete habits');
    throw error;
  }
};

export const bulkUpdateHabits = async (updates: { id: string, value: number | boolean }[]): Promise<void> => {
  try {
    for (const update of updates) {
      const habit = await HabitModel.create({ id: update.id } as any); // We only need the ID
      if (typeof update.value === 'boolean') {
        await habit.setChecked(update.value);
      } else {
        await habit.setValue(update.value);
      }
    }
    errorHandler.showInfo(`Successfully updated ${updates.length} habits`);
  } catch (error) {
    errorHandler.handleError(error, 'Failed to update habits');
    throw error;
  }
};

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
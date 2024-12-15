// HabitOperations.ts

import { format } from 'date-fns';
import { HabitStorageAPI, type Habit, type HabitData } from './HabitStorage';
import { errorHandler } from './ErrorUtils';
import { formatDateKey } from './HabitUtils';

export const updateHabitHistory = async (
  habitId: string, 
  value: number | boolean,
  date: Date = new Date()
): Promise<HabitData> => {
  try {
    const data = await HabitStorageAPI.handleHabitData('load');
    const dateKey = formatDateKey(date);
    
    if (!data.history[habitId]) {
      data.history[habitId] = {};
    }
    
    data.history[habitId][dateKey] = value;
    
    await HabitStorageAPI.handleHabitData('save', data);
    
    return data;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to update habit history');
    throw error;
  }
};


export const updateHabitValue = async (
  habits: Habit[], 
  id: string, 
  action: { type: 'quantity'; delta: number } | { type: 'checkbox'; checked: boolean }
): Promise<Habit[]> => {
  try {
    const data = await HabitStorageAPI.handleHabitData('load');
    const updatedHabits = habits.map(habit => {
      if (habit.id !== id) return habit;

      let updatedHabit;
      switch (action.type) {
        case 'quantity':
          const newQuantity = Math.max(0, habit.quantity + action.delta);
          updatedHabit = {
            ...habit,
            quantity: newQuantity,
            isBegun: newQuantity > 0,
            isComplete: habit.goal ? newQuantity >= habit.goal : false
          };
          data.history[id] = data.history[id] || {};
          data.history[id][formatDateKey(new Date())] = newQuantity;
          break;

        case 'checkbox':
          updatedHabit = {
            ...habit,
            isChecked: action.checked,
            isComplete: action.checked,
            isBegun: action.checked
          };
          data.history[id] = data.history[id] || {};
          data.history[id][formatDateKey(new Date())] = action.checked;
          break;
      }
      return updatedHabit;
    });

    await HabitStorageAPI.handleHabitData('save', { habits: updatedHabits, history: data.history });
    return updatedHabits;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to update habit');
    return habits;
  }
};

export const deleteHabit = async (habits: Habit[], id: string): Promise<Habit[]> => {
  try {
    const data = await HabitStorageAPI.handleHabitData('load');
    const updatedHabits = habits.filter(habit => habit.id !== id);
    const { [id]: deletedHistory, ...remainingHistory } = data.history;
    
    await HabitStorageAPI.handleHabitData('save', {
      habits: updatedHabits,
      history: remainingHistory
    });
    
    return updatedHabits;
  } catch (error) {
    errorHandler.handleError(error, 'Failed to delete habit');
    return habits; // Return original habits on error
  }
};

export const exportHabitHistoryToCSV = async (habits: Habit[]): Promise<void> => {
  try {
    const data = await HabitStorageAPI.handleHabitData('load');
    const history = data.history;
    
    if (!Object.keys(history).length) {
      throw new Error('No history data available to export');
    }

    // Get all unique dates from history
    const allDates = new Set<string>();
    Object.values(history).forEach(habitDates => {
      Object.keys(habitDates).forEach(date => allDates.add(date));
    });

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
    
    sortedDates.forEach(date => {
      const row = [date];
      habits.forEach(habit => {
        const value = history[habit.id]?.[date];
        row.push(typeof value === 'boolean' ? (value ? '1' : '0') : 
                typeof value === 'number' ? value.toString() : '');
      });
      csvRows.push(row.join(','));
    });

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
    throw error; // Re-throw to let calling code handle the error
  }
};

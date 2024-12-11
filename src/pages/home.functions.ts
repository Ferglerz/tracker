import { Storage } from '@ionic/storage';
import { format } from 'date-fns';
import sampleData from './sampleData.json';

// Toggle for using sample data
export const useSampleData = true;

export const exportHabitHistoryToCSV = async (habits: Habit[]): Promise<void> => {
  try {
    // Load history, handling both sample and real data cases
    const history = await loadHistory();
    
    if (!Object.keys(history).length) {
      console.error('No history data available to export');
      return;
    }

    const allDates = new Set<string>();
    
    // Collect all unique dates
    Object.values(history).forEach(habitDates => {
      Object.keys(habitDates).forEach(date => allDates.add(date));
    });

    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort();
    
    if (!sortedDates.length) {
      console.error('No dates found in history');
      return;
    }

    // Create CSV header with proper escaping for special characters
    const headers = ['Date', ...habits.map(h => {
      const name = h.name.includes(',') ? `"${h.name}"` : h.name;
      return `${name}${h.unit ? ` (${h.unit})` : ''}`;
    })];

    const csvRows = [headers.join(',')];
    
    // Create rows for each date
    sortedDates.forEach(date => {
      const row = [date];
      habits.forEach(habit => {
        const value = history[habit.id]?.[date];
        if (typeof value === 'boolean') {
          row.push(value ? '1' : '0');
        } else if (typeof value === 'number') {
          row.push(value.toString());
        } else {
          row.push('');
        }
      });
      csvRows.push(row.join(','));
    });

    // Create CSV content with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');
    
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
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
    console.error('Error exporting CSV:', error);
    throw new Error('Failed to export habit history');
  }
};

export interface Habit {
  id: string;
  name: string;
  type: 'checkbox' | 'quantity';
  unit?: string;
  quantity: number;
  goal?: number;
  isChecked: boolean;
  isComplete: boolean;
  isBegun: boolean;
  bgColor?: string;
}

export interface HabitHistory {
  [habitId: string]: {
    [date: string]: number | boolean;
  };
}

const store = new Storage();
store.create();

// Add initialization function
const initializeSampleData = async () => {
  if (useSampleData) {
    const currentHabits = await store.get('habits');
    const currentHistory = await store.get('habitHistory');
    
    const promises = [];
    
    if (!currentHabits || JSON.stringify(currentHabits) !== JSON.stringify(sampleData.habits)) {
      promises.push(store.set('habits', sampleData.habits));
    }
    
    if (!currentHistory || JSON.stringify(currentHistory) !== JSON.stringify(sampleData.history)) {
      promises.push(store.set('habitHistory', sampleData.history));
    }
    
    await Promise.all(promises);
  }
};

// Always try to initialize when the file is imported
initializeSampleData();

// Modify loadHabits and loadHistory to always load from storage
export const loadHabits = async (): Promise<Habit[]> => {
  const storedHabits = await store.get('habits');
  return storedHabits || [];
};

export const loadHistory = async (): Promise<HabitHistory> => {
  // First ensure initialization is complete
  await initializeSampleData();
  
  const history = await store.get('habitHistory');
  
  if (useSampleData) {
    try {
      // Data dump code...
    } catch (error) {
      console.error('Failed to create data dump:', error);
    }
  }
  
  return history || {};
};

// Only block saves if we're using sample data
export const saveHabits = async (habits: Habit[]): Promise<void> => {
  if (useSampleData) {
    console.log('Saving habits disabled while using sample data');
    return;
  }
  await store.set('habits', habits);
};

export const saveHistory = async (history: HabitHistory): Promise<void> => {
  if (useSampleData) {
    console.log('Saving history disabled while using sample data');
    return;
  }
  await store.set('habitHistory', history);
};

export const createHabit = (
  habits: Habit[],
  habitData: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>
): Habit[] => {
  const newHabit: Habit = {
    ...habitData,
    id: Date.now().toString(),
    quantity: 0,
    isChecked: false,
    isComplete: false,
    isBegun: false
  };
  return [...habits, newHabit];
};

export const editHabit = (
  habits: Habit[],
  habitId: string,
  habitData: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>
): Habit[] => {
  return habits.map(h => 
    h.id === habitId 
      ? { ...h, ...habitData }
      : h
  );
};

export const deleteHabit = (habits: Habit[], id: string): Habit[] => {
  return habits.filter(habit => habit.id !== id);
};

export const updateHabitHistory = async (
  habitId: string, 
  value: number | boolean,
  date: Date = new Date()
): Promise<HabitHistory> => {
  const history = await loadHistory();
  const dateKey = format(date, 'yyyy-MM-dd');
  
  if (!history[habitId]) {
    history[habitId] = {};
  }
  
  history[habitId][dateKey] = value;
  await saveHistory(history);
  return history;
};

export const getHabitHistory = async (
  habitId: string,
  startDate: Date,
  endDate: Date
): Promise<{ [date: string]: number | boolean }> => {
  const history = await loadHistory();
  return history[habitId] || {};
};

export const updateQuantity = async (habits: Habit[], id: string, delta: number): Promise<Habit[]> => {
  const updatedHabits = habits.map(habit => {
    if (habit.id === id) {
      const newQuantity = Math.max(0, habit.quantity + delta);
      const updatedHabit = {
        ...habit,
        quantity: newQuantity,
        isBegun: newQuantity > 0,
        isComplete: habit.goal ? newQuantity >= habit.goal : false
      };
      // Update history
      updateHabitHistory(id, newQuantity);
      return updatedHabit;
    }
    return habit;
  });
  return updatedHabits;
};

export const updateCheckbox = async (habits: Habit[], id: string, checked: boolean): Promise<Habit[]> => {
  const updatedHabits = habits.map(habit => {
    if (habit.id === id) {
      const updatedHabit = {
        ...habit,
        isChecked: checked,
        isComplete: checked,
        isBegun: checked
      };
      // Update history
      updateHabitHistory(id, checked);
      return updatedHabit;
    }
    return habit;
  });
  return updatedHabits;
};

export const getStatusForDate = (
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
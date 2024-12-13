import { format } from 'date-fns';
import { 
  loadHabits, 
  loadHistory, 
  saveHabits, 
  saveHistory,
  HabitHistory,
  Habit,
  getStatusColor 
} from './HabitStorage';
import sampleData from './sampleData.json';

export const useSampleData = false;

// Re-export storage functions that are used by other components
export { loadHabits, loadHistory, saveHabits, saveHistory, getStatusColor };
export type { Habit, HabitHistory };

// Business logic functions
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
  
  if (!useSampleData) {
    await saveHistory(history);
  }
  
  return history;
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
      updateHabitHistory(id, newQuantity);
      return updatedHabit;
    }
    return habit;
  });
  
  if (!useSampleData) {
    await saveHabits(updatedHabits);
  }
  
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
      updateHabitHistory(id, checked);
      return updatedHabit;
    }
    return habit;
  });
  
  if (!useSampleData) {
    await saveHabits(updatedHabits);
  }
  
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

export const exportHabitHistoryToCSV = async (habits: Habit[]): Promise<void> => {
  try {
    const history = await loadHistory();
    
    if (!Object.keys(history).length) {
      throw new Error('No history data available to export');
    }

    const allDates = new Set<string>();
    Object.values(history).forEach(habitDates => {
      Object.keys(habitDates).forEach(date => allDates.add(date));
    });

    const sortedDates = Array.from(allDates).sort();
    
    if (!sortedDates.length) {
      throw new Error('No dates found in history');
    }

    const headers = ['Date', ...habits.map(h => {
      const name = h.name.includes(',') ? `"${h.name}"` : h.name;
      return `${name}${h.unit ? ` (${h.unit})` : ''}`;
    })];

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

    const BOM = '\uFEFF';
    const csvContent = BOM + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = `habit-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    document.body.appendChild(link);
    link.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new Error('Failed to export habit history');
  }
};
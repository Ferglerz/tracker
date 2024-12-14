import { format } from 'date-fns';
import { HabitStorageAPI, type Habit, type HabitData } from './HabitStorage';

export const useSampleData = false;

export const createHabit = async (
  habits: Habit[],
  habitData: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>
): Promise<Habit[]> => {
  const newHabit: Habit = {
    ...habitData,
    id: Date.now().toString(),
    quantity: 0,
    isChecked: false,
    isComplete: false,
    isBegun: false
  };
  const updatedHabits = [...habits, newHabit];
  await HabitStorageAPI.handleHabitData('save', { habits: updatedHabits, history: {} });
  return updatedHabits;
};

export const editHabit = async (
  habits: Habit[],
  habitId: string,
  habitData: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>
): Promise<Habit[]> => {
  const updatedHabits = habits.map(h => 
    h.id === habitId 
      ? { ...h, ...habitData }
      : h
  );
  const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
  await HabitStorageAPI.handleHabitData('save', { ...data, habits: updatedHabits });
  return updatedHabits;
};

export const deleteHabit = async (habits: Habit[], id: string): Promise<Habit[]> => {
  const updatedHabits = habits.filter(habit => habit.id !== id);
  const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
  const { [id]: deletedHistory, ...remainingHistory } = data.history;
  await HabitStorageAPI.handleHabitData('save', { habits: updatedHabits, history: remainingHistory });
  return updatedHabits;
};

export const updateHabitHistory = async (
  habitId: string, 
  value: number | boolean,
  date: Date = new Date()
): Promise<HabitData> => {
  const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
  const dateKey = format(date, 'yyyy-MM-dd');
  
  if (!data.history[habitId]) {
    data.history[habitId] = {};
  }
  
  data.history[habitId][dateKey] = value;
  
  if (!useSampleData) {
    await HabitStorageAPI.handleHabitData('save', data);
  }
  
  return data;
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
    const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
    await HabitStorageAPI.handleHabitData('save', { ...data, habits: updatedHabits });
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
    const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
    await HabitStorageAPI.handleHabitData('save', { ...data, habits: updatedHabits });
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
    const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
    const history = data.history;
    
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
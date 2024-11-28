import { Storage } from '@ionic/storage';
import { format } from 'date-fns';
import { sampleHabits, sampleHistory } from './sampleData';

// Toggle for using sample data
export const useSampleData = false;

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
    
    if (!currentHabits || JSON.stringify(currentHabits) !== JSON.stringify(sampleHabits)) {
      promises.push(store.set('habits', sampleHabits));
    }
    
    if (!currentHistory || JSON.stringify(currentHistory) !== JSON.stringify(sampleHistory)) {
      promises.push(store.set('habitHistory', sampleHistory));
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

// if only one function could save the future, too.
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
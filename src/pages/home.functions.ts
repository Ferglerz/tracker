import { Storage } from '@ionic/storage';
import { format } from 'date-fns';

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
}

export interface HabitHistory {
  [habitId: string]: {
    [date: string]: number | boolean;
  };
}

const store = new Storage();
store.create();

export const loadHabits = async (): Promise<Habit[]> => {
  const storedHabits = await store.get('habits');
  return storedHabits || [];
};

export const loadHistory = async (): Promise<HabitHistory> => {
  const history = await store.get('habitHistory');
  return history || {};
};

export const saveHabits = async (habits: Habit[]): Promise<void> => {
  await store.set('habits', habits);
};

export const saveHistory = async (history: HabitHistory): Promise<void> => {
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
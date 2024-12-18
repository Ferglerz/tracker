// HabitUtils.ts
import { format } from 'date-fns';
import { HabitModel } from './HabitModel';

export const formatDateKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
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
  habit: HabitModel
): 'complete' | 'partial' | 'none' => {
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
};

export const getHighlightStyle = (value: number | boolean | undefined, habit: HabitModel) => {
  const status = getHabitStatus(value, habit);
  
  return {
    textColor: status === 'none' ? '#000000' : '#ffffff',
    backgroundColor: getStatusColor(status)
  };
};

export const calculateStreak = (habit: HabitModel, endDate: Date = new Date()): number => {
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
};

export const calculateCompletion = (habit: HabitModel, startDate: Date, endDate: Date) => {
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
};

export const formatHabitValue = (habit: HabitModel, value?: number | boolean): string => {
  if (value === undefined) return '-';
  
  if (habit.type === 'checkbox') {
    return value ? '✓' : '✗';
  }
  
  if (typeof value === 'number') {
    return `${value}${habit.unit ? ` ${habit.unit}` : ''}`;
  }
  
  return '-';
};

export const generateHabitSummary = (habit: HabitModel): string => {
  const streak = calculateStreak(habit);
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const completion = calculateCompletion(habit, startOfMonth, today);

  return `${habit.name}: ${streak} day streak, ${completion.percentage.toFixed(1)}% completion this month`;
};

export const validateHabitData = (data: unknown): data is Parameters<typeof HabitModel.create>[0] => {
  if (!data || typeof data !== 'object') return false;
  
  const habitData = data as Partial<Parameters<typeof HabitModel.create>[0]>;
  return !!(
    habitData.id &&
    habitData.name &&
    habitData.type &&
    habitData.bgColor
  );
};
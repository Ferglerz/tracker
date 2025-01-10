import { HabitEntity } from '@utils/HabitEntity';
import { Habit } from '@utils/TypesAndProps';

interface HistoryRangeItem {
  date: string;
  value: [number, number];
}

export const getTodayString = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

export const getHistoryRange = (
  habit: HabitEntity, 
  days: number
): HistoryRangeItem[] => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (days - 1));

  return Array.from({ length: days }, (_, index) => {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + index);
    const dateString = currentDate.toISOString().split('T')[0];
    const historyValue = habit.history[dateString];
    
    return {
      date: dateString,
      value: [
        historyValue?.quantity ?? 0,
        historyValue?.goal ?? habit.goal // goal is now required
      ]
    };
  });
};

type StatusType = 'complete' | 'partial' | 'none';

interface StatusColors {
  complete: string;
  partial: string;
  none: string;
}

const STATUS_COLORS: StatusColors = {
  complete: '#2dd36f',
  partial: '#ffc409',
  none: 'transparent',
} as const;

export const getStatusColor = (status: StatusType): string => {
  return STATUS_COLORS[status];
};

export const getHabitStatus = (
  value: Habit.HistoryEntry | undefined,
  habit: HabitEntity
): StatusType => {
  if (!value || value.quantity <= 0) {
    return 'none';
  }
  
  if (habit.type === 'checkbox' || value.goal <= 0) {
    return 'complete';
  }

  return value.quantity >= value.goal ? 'complete' : 'partial';
};
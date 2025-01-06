import { HabitEntity } from './HabitEntity';
import { Habit } from './TypesAndProps';

export const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

// Calculates the status history for a habit for a given number of days
export const getHistoryRange = (habit: HabitEntity, days: number): Array<{ date: string; value: [number, number] | boolean }> => {
  const dates: Array<{ date: string; value: [number, number] | boolean }> = [];
  const today = new Date();

  // Start from the date `days` ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (days - 1));

  const getValue = habit.type === 'checkbox'
    ? (historyValue: Habit.HistoryEntry | undefined): boolean => historyValue?.isChecked ?? false
    : (historyValue: Habit.HistoryEntry | undefined): [number, number] => historyValue
      ? [historyValue.quantity, historyValue.goal]
      : [0, habit.goal || 0];

  // Use a loop to iterate through the days
  for (let i = 0; i < days; i++) {
    // Calculate the date for the current iteration
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    // Format the date as a string (e.g., 'YYYY-MM-DD')
    const dateString = currentDate.toISOString().split('T')[0];

    const historyValue = habit.history[dateString];

    dates.push({
      date: dateString, // Use the formatted date string
      value: getValue(historyValue),
    });
  }

  return dates;
};

// Color map for different habit statuses
const statusColorMap = {
  complete: '#2dd36f',
  partial: '#ffc409',
  none: 'transparent',
};

// Returns the color associated with a given habit status
export const getStatusColor = (status: 'complete' | 'partial' | 'none'): string => {
  return statusColorMap[status];
};

// Determines the status of a habit for a specific date
export const getHabitStatus = (
  value: Habit.HistoryEntry | undefined,
  habit: HabitEntity
): 'complete' | 'partial' | 'none' => {
  if (!value) return 'none';

  if (habit.type === 'checkbox') {
    return value.isChecked ? 'complete' : 'none';
  }

  if (value.goal <= 0) {
    return value.quantity > 0 ? 'complete' : 'none';
  }

  if (value.quantity >= value.goal) return 'complete';
  if (value.quantity > 0) return 'partial';

  return 'none';
};
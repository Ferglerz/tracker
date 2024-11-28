import { Storage } from '@ionic/storage';
import { format, parseISO } from 'date-fns';

// Type for quantity habit records: [current_value, goal_value]
type QuantityRecord = [number, number];

// Type for checkbox habit records
type CheckboxRecord = boolean;

// Combined type for habit records
type HabitRecord = QuantityRecord | CheckboxRecord;

// Interface for habit history structure
interface HabitHistory {
  [habitId: string]: {
    [date: string]: HabitRecord;
  };
}

const store = new Storage();
store.create();

// Helper function to determine if a record is a quantity record
const isQuantityRecord = (record: HabitRecord): record is QuantityRecord => {
  return Array.isArray(record) && record.length === 2;
};

export const saveHabitRecord = async (
  habitId: string,
  value: HabitRecord,
  date: Date = new Date()
): Promise<void> => {
  const history = await loadHabitHistory();
  const dateKey = format(date, 'yyyy-MM-dd');

  if (!history[habitId]) {
    history[habitId] = {};
  }

  history[habitId][dateKey] = value;
  await store.set('habitHistory', history);
};

export const loadHabitHistory = async (): Promise<HabitHistory> => {
  const history = await store.get('habitHistory');
  return history || {};
};

export const getHabitStatus = (
  record: HabitRecord | undefined
): 'complete' | 'partial' | 'none' => {
  if (!record) return 'none';

  if (isQuantityRecord(record)) {
    const [current, goal] = record;
    if (current >= goal) return 'complete';
    if (current > 0) return 'partial';
    return 'none';
  }

  return record ? 'complete' : 'none';
};

export const updateQuantityHabit = async (
  habitId: string,
  currentValue: number,
  goalValue: number,
  date: Date = new Date()
): Promise<void> => {
  await saveHabitRecord(habitId, [currentValue, goalValue], date);
};

export const updateCheckboxHabit = async (
  habitId: string,
  checked: boolean,
  date: Date = new Date()
): Promise<void> => {
  await saveHabitRecord(habitId, checked, date);
};

export const getHabitRecordsForMonth = async (
  habitId: string,
  month: Date
): Promise<{ [date: string]: HabitRecord }> => {
  const history = await loadHabitHistory();
  const habitHistory = history[habitId] || {};
  
  // Filter records for the specified month
  const monthStart = format(new Date(month.getFullYear(), month.getMonth(), 1), 'yyyy-MM');
  return Object.entries(habitHistory)
    .filter(([date]) => date.startsWith(monthStart))
    .reduce((acc, [date, record]) => ({
      ...acc,
      [date]: record
    }), {});
};

// Helper to get color for calendar day
export const getStatusColor = (status: 'complete' | 'partial' | 'none'): string => {
  switch (status) {
    case 'complete':
      return '#2dd36f'; // green
    case 'partial':
      return '#ffc409'; // orange
    case 'none':
      return 'transparent';
  }
};

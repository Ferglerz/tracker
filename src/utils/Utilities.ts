//Utilities.tsx
import { useState, useCallback } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { HabitEntity } from '@utils/HabitEntity';
import { Habit } from '@utils/TypesAndProps';
import { CONSTANTS } from '@utils/Constants';

interface HistoryRangeItem {
  date: string;
  value: [number, number];
}

export interface ColorAdjustOptions {
  lighter?: boolean;
  opacity?: number;
}

export const adjustColor = (color: string, options: ColorAdjustOptions = {}): string => {
  if (!color) return color;

  const { lighter, opacity } = options;

  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    if (lighter) {
      const lighterRGB = [r, g, b].map(c =>
        Math.min(255, c + (255 - c) * 0.3)
      );
      return opacity !== undefined
        ? `rgba(${lighterRGB.join(', ')}, ${opacity})`
        : `rgb(${lighterRGB.join(', ')})`;
    }

    return opacity !== undefined
      ? `rgba(${r}, ${g}, ${b}, ${opacity})`
      : color;
  }

  if (color.startsWith('rgb')) {
    if (opacity !== undefined) {
      return color.startsWith('rgba')
        ? color.replace(/[\d.]+\)$/g, `${opacity})`)
        : color.replace(')', `, ${opacity})`);
    }
    return color;
  }

  return color;
};

export const getContrastText = (hexColor: string): string => {
  // If it's a CSS var or invalid, fallback to black
  if (!hexColor || hexColor.startsWith('var(')) return '#000000';

  let r = 0, g = 0, b = 0;
  if (hexColor.startsWith('#')) {
    const hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
      g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
      b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else if (hexColor.startsWith('rgb')) {
    const match = hexColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      r = parseInt(match[1], 10);
      g = parseInt(match[2], 10);
      b = parseInt(match[3], 10);
    }
  }

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export const useAnimatedPress = () => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback((callback?: () => void) => {
    setIsPressed(true);
    if (callback) callback();
    setTimeout(() => setIsPressed(false), 200);
  }, []);

  return { isPressed, handlePress };
};

export const getTransform = (isPressed: boolean, type: 'increment' | 'decrement' | 'scale') => {
  if (!isPressed) return 'scale(1) rotate(0deg)';

  switch (type) {
    case 'increment':
      return 'scale(1.2) rotate(11deg)';
    case 'decrement':
      return 'scale(0.8) rotate(-7deg)';
    case 'scale':
      return 'scale(1.2) rotate(5deg)';
    default:
      return 'scale(1) rotate(0deg)';
  }
};

export const formatDateString = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getTodayString = (): string => {
  return formatDateString(new Date());
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
    const dateString = formatDateString(currentDate);
    const historyValue = habit.history[dateString];

    return {
      date: dateString,
      value: [
        historyValue?.quantity ?? 0,
        historyValue?.goal ?? habit.goal
      ]
    };
  });
};

type StatusType = 'complete' | 'partial' | 'none';

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

export const getPeriodProgress = (habit: HabitEntity, dateStr: string = getTodayString()) => {
  const date = new Date(dateStr);
  // Ensure we process it as local date time correctly to avoid timezone shifts
  date.setHours(12, 0, 0, 0);
  const frequency = habit.frequency || 'daily';
  let startDate: Date;
  let endDate: Date;

  if (frequency === 'weekly') {
    startDate = startOfWeek(date, { weekStartsOn: 1 });
    endDate = endOfWeek(date, { weekStartsOn: 1 });
  } else if (frequency === 'monthly') {
    startDate = startOfMonth(date);
    endDate = endOfMonth(date);
  } else {
    const entry = habit.history[dateStr] || { quantity: 0, goal: habit.goal };
    return {
      quantity: entry.quantity,
      goal: entry.goal,
      isComplete: getHabitStatus(entry, habit) === 'complete'
    };
  }

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  let totalQuantity = 0;

  days.forEach(d => {
    const dStr = formatDateString(d);
    totalQuantity += habit.history[dStr]?.quantity || 0;
  });

  const goal = habit.goal;
  const isComplete = totalQuantity >= goal;

  return {
    quantity: totalQuantity,
    goal,
    isComplete
  };
};

export const getFillColor = (
  value: [number, number],
  type: Habit.Type,
  color: string
): string => {
  const [quantity, goal] = value;

  if (!quantity || quantity <= 0) {
    return CONSTANTS.HISTORY_GRID.DEFAULT_GRAY;
  }

  if (type === 'checkbox' || !goal) {
    return color;
  }

  const colorIntensity = Math.min(quantity / goal, 1);
  return adjustColor(color, { opacity: colorIntensity });
};

export const isNewDay = (lastCheck: Date, currentTime: Date = new Date()): boolean => {
  return lastCheck.getDate() !== currentTime.getDate() ||
         lastCheck.getMonth() !== currentTime.getMonth() ||
         lastCheck.getFullYear() !== currentTime.getFullYear();
};

export const calculateStreaks = (
  habit: HabitEntity,
  referenceDate: Date = new Date(),
): { currentStreak: number, longestStreak: number } => {
  const historyDates = Object.keys(habit.history).sort();
  if (historyDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const frequency = habit.frequency;
  const periodStart = (date: Date): Date => {
    if (frequency === 'weekly') return startOfWeek(date, { weekStartsOn: 1 });
    if (frequency === 'monthly') return startOfMonth(date);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  };
  const movePeriod = (date: Date, amount: number): Date => {
    const moved = new Date(date);
    if (frequency === 'monthly') moved.setMonth(moved.getMonth() + amount, 1);
    else moved.setDate(moved.getDate() + amount * (frequency === 'weekly' ? 7 : 1));
    return periodStart(moved);
  };
  const parseLocalDate = (date: string): Date => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const isPeriodComplete = (start: Date): boolean => {
    if (frequency === 'daily') {
      return getHabitStatus(habit.history[formatDateString(start)], habit) === 'complete';
    }
    const end = frequency === 'weekly' ? endOfWeek(start, { weekStartsOn: 1 }) : endOfMonth(start);
    const quantity = eachDayOfInterval({ start, end }).reduce(
      (total, day) => total + (habit.history[formatDateString(day)]?.quantity ?? 0),
      0,
    );
    return habit.type === 'checkbox' ? quantity > 0 : quantity >= habit.goal;
  };

  const firstPeriod = periodStart(parseLocalDate(historyDates[0]));
  const currentPeriod = periodStart(referenceDate);
  let longestStreak = 0;
  let run = 0;
  for (
    let period = new Date(firstPeriod);
    period <= currentPeriod;
    period = movePeriod(period, 1)
  ) {
    if (isPeriodComplete(period)) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  let currentStreak = 0;
  for (
    let period = new Date(currentPeriod), isCurrent = true;
    period >= firstPeriod;
    period = movePeriod(period, -1), isCurrent = false
  ) {
    if (isPeriodComplete(period)) currentStreak += 1;
    else if (!isCurrent) break;
  }

  return { currentStreak, longestStreak };
};
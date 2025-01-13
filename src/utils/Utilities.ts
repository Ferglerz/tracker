import { HabitEntity } from '@utils/HabitEntity';
import { Habit } from '@utils/TypesAndProps';
import { useState, useCallback } from 'react';

interface HistoryRangeItem {
  date: string;
  value: [number, number];
}


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
        historyValue?.goal ?? habit.goal
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

export const applyGridVisibility = (shouldShow: boolean) => {
  const gridContainers = document.querySelectorAll('.history-grid');
  gridContainers.forEach((gridContainer) => {
    if (shouldShow) {
      gridContainer.classList.remove('hide-grid-elements');
    } else {
      gridContainer.classList.add('hide-grid-elements');
    }
  });
};
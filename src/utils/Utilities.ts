//Utilities.tsx
import { useState, useCallback } from 'react';
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
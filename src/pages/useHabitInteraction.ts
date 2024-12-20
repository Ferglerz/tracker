// useHabitInteraction.ts
import { useState, useCallback, useEffect } from 'react';
import { HabitEntity } from './HabitEntity';
import { errorHandler } from './ErrorUtils';
import { calculateStreak } from './HabitUtils';

interface InteractionState {
  streak: number;
  isUpdating: boolean;
  lastUpdateTime: number;
  hasChanges: boolean;
}

export function useHabitInteraction(habit: HabitEntity) {
  const [state, setState] = useState<InteractionState>({
    streak: 0,
    isUpdating: false,
    lastUpdateTime: 0,
    hasChanges: false
  });

  // Calculate and update streak when habit changes
  useEffect(() => {
    const subscription = habit.changes.subscribe(() => {
      calculateStreak(habit).then(currentStreak => {
        setState(prev => ({
          ...prev,
          streak: currentStreak,
          hasChanges: true,
          lastUpdateTime: Date.now()
        }));
      });
    });

    // Initial calculation
    calculateStreak(habit).then(streak => {
      setState(prev => ({ ...prev, streak }));
    });

    return () => subscription.unsubscribe();
  }, [habit]);

  const handleToggle = useCallback(async () => {
    if (state.isUpdating) return;

    setState(prev => ({ ...prev, isUpdating: true }));
    try {
      if (habit.type === 'checkbox') {
        await habit.setChecked(!habit.isChecked);
      } else {
        await habit.increment(1);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to toggle habit');
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [habit, state.isUpdating]);

  const handleIncrement = useCallback(async (amount: number) => {
    if (state.isUpdating || habit.type !== 'quantity') return;

    setState(prev => ({ ...prev, isUpdating: true }));
    try {
      await habit.increment(amount);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to increment habit');
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [habit, state.isUpdating]);

  const handleSetValue = useCallback(async (value: number | boolean, date?: Date) => {
    if (state.isUpdating) return;

    setState(prev => ({ ...prev, isUpdating: true }));
    try {
      if (habit.type === 'checkbox') {
        await habit.setChecked(value as boolean, date);
      } else {
        await habit.setValue(value as number, date);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to set habit value');
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [habit, state.isUpdating]);

  return {
    streak: state.streak,
    isUpdating: state.isUpdating,
    lastUpdateTime: state.lastUpdateTime,
    hasChanges: state.hasChanges,
    handleToggle,
    handleIncrement,
    handleSetValue,
  };
}
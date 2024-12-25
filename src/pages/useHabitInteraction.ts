// useHabitInteraction.ts
import { useState, useCallback, useEffect } from 'react';
import { HabitEntity } from './HabitEntity';
import { HabitRegistry } from './HabitRegistry';
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
        await HabitRegistry.setChecked(habit.id, !habit.isChecked);
      } else {
        await HabitRegistry.increment(habit.id, 1);
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
      await HabitRegistry.increment(habit.id, amount);
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
        await HabitRegistry.setChecked(habit.id, value as boolean, date);
      } else {
        await HabitRegistry.setValue(habit.id, value as number, date);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to set habit value');
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [habit, state.isUpdating]);

  const handleDateUpdate = useCallback(async (date: Date, value: number | boolean) => {
    if (state.isUpdating) return;

    setState(prev => ({ ...prev, isUpdating: true }));
    try {
      if (habit.type === 'checkbox') {
        await HabitRegistry.setChecked(habit.id, value as boolean, date);
      } else {
        await HabitRegistry.setValue(habit.id, value as number, date);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update habit for date');
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  }, [habit, state.isUpdating]);

  // Utility methods to check status
  const isComplete = useCallback((date?: Date) => {
    if (date) {
      return habit.getStatusForDate(date) === 'complete';
    }
    return habit.isComplete;
  }, [habit]);

  const isPartial = useCallback((date?: Date) => {
    if (date) {
      return habit.getStatusForDate(date) === 'partial';
    }
    return habit.isBegun && !habit.isComplete;
  }, [habit]);

  const getValue = useCallback((date?: Date) => {
    if (date) {
      return habit.getValueForDate(date);
    }
    return habit.type === 'checkbox' ? habit.isChecked : habit.quantity;
  }, [habit]);

  return {
    // State
    streak: state.streak,
    isUpdating: state.isUpdating,
    lastUpdateTime: state.lastUpdateTime,
    hasChanges: state.hasChanges,
    
    // Action handlers
    handleToggle,
    handleIncrement,
    handleSetValue,
    handleDateUpdate,
    
    // Status checks
    isComplete,
    isPartial,
    getValue,

    // Additional utility getters
    progress: habit.type === 'quantity' && habit.goal 
      ? Math.min(100, (habit.quantity / habit.goal) * 100)
      : habit.isComplete ? 100 : 0,
    
    currentValue: habit.type === 'checkbox' ? habit.isChecked : habit.quantity,
  };
}
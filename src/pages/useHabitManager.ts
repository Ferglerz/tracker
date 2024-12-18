// useHabitManager.ts
import { useState, useCallback, useEffect } from 'react';
import { HabitStorageAPI, type Habit, type HabitData } from './HabitStorage';
import { updateHabitValue, deleteHabit, exportHabitHistoryToCSV } from './HabitOperations';
import { UpdateAction } from './HabitTypes';
import { errorHandler } from './ErrorUtils';

interface HabitManagerState {
  habitsData: HabitData;
  isFormOpen: boolean;
  editingHabit: Habit | null;
  habitToDelete: string | null;
}

export function useHabitManager() {
  const [state, setState] = useState<HabitManagerState>({
    habitsData: { habits: [], history: {} },
    isFormOpen: false,
    editingHabit: null,
    habitToDelete: null
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await HabitStorageAPI.init();
        setState(prev => ({ ...prev, habitsData: data }));
      } catch (error) {
        errorHandler.handleError(error, 'Failed to load habits');
      }
    };

    loadData();

    // Subscribe to storage changes
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateHabits = useCallback((newHabits: Habit[]) => {
    setState(prev => ({
      ...prev,
      habitsData: { ...prev.habitsData, habits: newHabits }
    }));
  }, []);

  const handleHabitUpdate = useCallback(async (id: string, action: UpdateAction) => {
    try {
      const updatedHabits = await updateHabitValue(state.habitsData.habits, id, action);
      updateHabits(updatedHabits);
    } catch (error) {
      errorHandler.handleError(error, `Failed to update habit ${action.type}`);
    }
  }, [state.habitsData.habits, updateHabits]);

  const handleDeleteHabit = useCallback(async () => {
    if (!state.habitToDelete) return;

    try {
      const updatedHabits = await deleteHabit(state.habitsData.habits, state.habitToDelete);
      setState(prev => ({
        ...prev,
        habitsData: { 
          ...prev.habitsData, 
          habits: updatedHabits 
        },
        habitToDelete: null
      }));
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
      // Reload original data if deletion failed
      const originalData = await HabitStorageAPI.handleHabitData('load');
      setState(prev => ({
        ...prev,
        habitsData: originalData
      }));
    }
  }, [state.habitToDelete, state.habitsData.habits]);

  const handleExport = useCallback(async () => {
    try {
      await exportHabitHistoryToCSV(state.habitsData.habits);
      errorHandler.showInfo('Export completed successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to export habit data');
    }
  }, [state.habitsData.habits]);

  const handleSaveHabit = useCallback(async (formData: Omit<Habit, 'id' | 'isChecked' | 'isComplete' | 'isBegun' | 'quantity'>) => {
    try {
      // First, get the latest data to ensure we're working with current state
      const currentData = await HabitStorageAPI.handleHabitData('load');
      
      const habitData = {
        ...formData,
        id: state.editingHabit?.id || Date.now().toString(),
        quantity: state.editingHabit?.quantity || 0,
        isChecked: state.editingHabit?.isChecked || false,
        isComplete: state.editingHabit?.isComplete || false,
        isBegun: state.editingHabit?.isBegun || false
      };
  
      // Update habits array
      const updatedHabits = state.editingHabit 
        ? currentData.habits.map(h => h.id === habitData.id ? habitData : h)
        : [...currentData.habits, habitData];
  
      // Create new data object
      const newData = {
        ...currentData,
        habits: updatedHabits,
        history: {
          ...currentData.history,
          [habitData.id]: currentData.history[habitData.id] || {}
        }
      };
      
      // Save to storage
      await HabitStorageAPI.handleHabitData('save', newData);
      
      // Update local state
      setState(prev => ({
        ...prev,
        habitsData: newData,
        isFormOpen: false,
        editingHabit: null
      }));
  
      // Trigger a widget refresh if available
      try {
        await HabitStorageAPI.refreshWidgets();
      } catch (error) {
        console.warn('Failed to refresh widgets:', error);
        // Don't fail the save operation if widget refresh fails
      }
  
      return true;
    } catch (error) {
      errorHandler.handleError(error, 'Failed to save habit');
      throw error;
    }
  }, [state.editingHabit]);

  const openForm = useCallback((habit?: Habit) => {
    setState(prev => ({
      ...prev,
      isFormOpen: true,
      editingHabit: habit || null
    }));
  }, []);

  const closeForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      isFormOpen: false,
      editingHabit: null
    }));
  }, []);

  const confirmDelete = useCallback((habitId: string) => {
    setState(prev => ({ ...prev, habitToDelete: habitId }));
  }, []);

  const cancelDelete = useCallback(() => {
    setState(prev => ({ ...prev, habitToDelete: null }));
  }, []);

  return {
    habits: state.habitsData.habits,
    isFormOpen: state.isFormOpen,
    editingHabit: state.editingHabit,
    habitToDelete: state.habitToDelete,
    handleHabitUpdate,
    handleDeleteHabit,
    handleExport,
    handleSaveHabit,
    openForm,
    closeForm,
    confirmDelete,
    cancelDelete
  };
}
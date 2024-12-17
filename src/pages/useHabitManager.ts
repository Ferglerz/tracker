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
        habitsData: { ...prev.habitsData, habits: updatedHabits },
        habitToDelete: null
      }));
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
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
      const currentData = await HabitStorageAPI.handleHabitData('load');
      
      const habitData = {
        ...formData,
        id: state.editingHabit?.id || Date.now().toString(),
        quantity: state.editingHabit?.quantity || 0,
        isChecked: state.editingHabit?.isChecked || false,
        isComplete: state.editingHabit?.isComplete || false,
        isBegun: state.editingHabit?.isBegun || false
      };
  
      const updatedHabits = state.editingHabit 
        ? currentData.habits.map(h => h.id === state.editingHabit.id ? habitData : h)
        : [...currentData.habits, habitData];
  
      const newData = {
        ...currentData,
        habits: updatedHabits
      };
      
      await HabitStorageAPI.handleHabitData('save', newData);
      setState(prev => ({
        ...prev,
        habitsData: newData,
        isFormOpen: false,
        editingHabit: null
      }));
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
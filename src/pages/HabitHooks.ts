// HabitHooks.ts
import { useState, useCallback, useEffect } from 'react';
import { HabitEntity } from './HabitEntity';
import { HabitCSVService } from './HabitCSVService';
import { errorHandler } from './ErrorUtils';
import { HabitStorage } from './HabitStorage';  // Update this import

// HabitHooks.ts

export function useHabits() {
  const [habits, setHabits] = useState<HabitEntity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial load
  const loadHabits = useCallback(async (forceRefresh: boolean = false) => {
    console.log('Loading habits...'); 
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      }
      const loadedHabits = await HabitEntity.loadAll();
      console.log('Loaded habits:', loadedHabits.length);
      setHabits(loadedHabits);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habits');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Subscribe to storage changes
  useEffect(() => {
    console.log('Setting up storage subscription...');
    const storage = HabitStorage.getInstance();
    const subscription = storage.changes.subscribe((data) => {
      console.log('Storage change detected, updating habits');
      const newHabits = data.habits.map(h => new HabitEntity(h));
      setHabits(newHabits);
    });

    return () => {
      console.log('Cleaning up storage subscription...');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const refreshHabits = useCallback(async () => {
    await loadHabits(true);
  }, [loadHabits]);

  return {
    habits,
    isRefreshing,
    refreshHabits,
    loadHabits
  };
}

export function useHabitForm() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitEntity | undefined>(undefined);

  const openForm = useCallback((habit?: HabitEntity) => {
    setEditingHabit(habit);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingHabit(undefined);
  }, []);

  return {
    isFormOpen,
    editingHabit,
    openForm,
    closeForm
  };
}

export function useHabitDelete(onDeleteSuccess: () => Promise<void>) {
  const [habitToDelete, setHabitToDelete] = useState<HabitEntity | null>(null);

  const handleDeleteHabit = useCallback(async () => {
    if (!habitToDelete) return;

    try {
      await HabitEntity.delete(habitToDelete.id);
      await onDeleteSuccess();
      setHabitToDelete(null);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
    }
  }, [habitToDelete, onDeleteSuccess]);

  return {
    habitToDelete,
    setHabitToDelete,
    handleDeleteHabit
  };
}

export function useHabitExport(habits: HabitEntity[]) {
  const handleExport = useCallback(async () => {
    try {
      await HabitCSVService.exportHabits(habits);
      errorHandler.showInfo('Export completed successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to export habit data');
    }
  }, [habits]);

  return { handleExport };
}
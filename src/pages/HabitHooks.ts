// HabitHooks.ts
import { useState, useCallback, useEffect } from 'react';
import { HabitEntity } from './HabitEntity';
import { HabitCSVService } from './HabitCSVService';
import { errorHandler } from './ErrorUtils';

export function useHabits() {
  const [habits, setHabits] = useState<HabitEntity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHabits = useCallback(async (forceRefresh: boolean = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      }
      const loadedHabits = await HabitEntity.loadAll();
      setHabits(loadedHabits);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habits');
    } finally {
      setIsRefreshing(false);
    }
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
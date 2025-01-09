// HabitHooks.ts
import { useState, useCallback, useEffect } from 'react';
import { HabitEntity } from '@utils/HabitEntity';
import { HabitCSVService } from '@utils/ImportCSV';
import { HabitStorage } from '@utils/Storage';
import { App } from '@capacitor/app';

export function useHabitReload(habitId: string) {
  const [habit, setHabit] = useState<HabitEntity | null>(null);

  const reloadHabit = useCallback(async () => {
    const habits = await HabitEntity.loadAll();
    const updatedHabit = habits.find(h => h.id === habitId);
    if (updatedHabit) {
      setHabit(updatedHabit);
    }
  }, [habitId]);

  useEffect(() => {
    const storage = HabitStorage.getInstance();

    // Initial load
    reloadHabit();

    // Register for updates
    storage.registerHabitCallback(habitId, reloadHabit);

    return () => {
      storage.unregisterHabitCallback(habitId, reloadHabit);
    };
  }, [habitId, reloadHabit]);

  return habit;
}

export function useHabits() {
  const [habits, setHabits] = useState<HabitEntity[]>([]);

  const loadHabits = useCallback(async () => {
    try {
      const loadedHabits = await HabitEntity.loadAll();
      setHabits(loadedHabits);
      //alert(JSON.stringify(loadedHabits));
    } catch (error) {
      console.error('Failed to load habits:', error);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadHabits();

    // Set up listener for future state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        loadHabits();

        alert('Focus state change');
      }
    });
  }, [loadHabits]);

  const refreshHabits = useCallback(async () => {
    await loadHabits();
  }, [loadHabits]);

  return {
    habits,
    refreshHabits,
    loadHabits
  };
}

export function useHabitForm() {
  const [editingHabit, setEditingHabit] = useState<HabitEntity | undefined>(undefined);

  return {
    editingHabit,
    setEditingHabit,
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
      alert('Failed to delete habit - useHabitDelete');
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
      alert('Export completed successfully');
    } catch (error) {
      alert('Failed to export habit data');
    }
  }, [habits]);

  return { handleExport };
}
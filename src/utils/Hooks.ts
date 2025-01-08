// HabitHooks.ts
import { useState, useCallback, useEffect } from 'react';
import { HabitEntity } from '@utils/HabitEntity';
import { HabitCSVService } from '@utils/ImportCSV';
import { HabitStorage } from '@utils/Storage'; 
import { App } from '@capacitor/app';

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
      alert('Failed to load habits!');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const setupListener = async () => {
      const subscription = await App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive) {
          await loadHabits(true);
        }
      });
      return () => { subscription.remove(); };
    };
  
    setupListener();
}, [loadHabits]);

  // Subscribe to storage changes
  useEffect(() => {
    const storage = HabitStorage.getInstance();
    const subscription = storage.changes.subscribe(async () => {
      // When storage changes, refresh habits
      await loadHabits();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadHabits]);

  // Initial load
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
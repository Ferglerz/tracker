// useHabitManager.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { HabitEntity } from './HabitEntity';
import { HabitRegistry } from './HabitRegistry';
import { Habit } from './HabitTypes';
import { errorHandler } from './ErrorUtils';
import { getHabitStats } from './HabitOperations';
import { HabitCSVService } from './HabitCSVService';

interface ManagerState {
  habits: HabitEntity[];
  isFormOpen: boolean;
  editingHabit: HabitEntity | null;
  habitToDelete: HabitEntity | null;
  isLoading: boolean;
  sortBy: Habit.Sort['field'];
  sortDirection: Habit.Sort['direction'];
  filterType: 'all' | Habit.Type;
  searchTerm: string;
}

export function useHabitManager(initialFilters?: Partial<ManagerState>) {
  const [state, setState] = useState<ManagerState>({
    habits: [],
    isFormOpen: false,
    editingHabit: null,
    habitToDelete: null,
    isLoading: false,
    sortBy: 'created',
    sortDirection: 'desc',
    filterType: 'all',
    searchTerm: '',
    ...initialFilters
  });

  const updateState = useCallback((updates: Partial<ManagerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleAsyncOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    errorMessage: string,
    successMessage?: string
  ): Promise<T | null> => {
    try {
      const result = await operation();
      if (successMessage) {
        errorHandler.showInfo(successMessage);
      }
      return result;
    } catch (error) {
      errorHandler.handleError(error, errorMessage);
      return null;
    }
  }, []);

  // Load initial habits and setup subscriptions
  useEffect(() => {
    const subscriptions = new Set<{ unsubscribe: () => void }>();
    
    const loadHabits = async () => {
      updateState({ isLoading: true });
      const habits = await handleAsyncOperation(
        HabitRegistry.getAll,
        'Failed to load habits'
      );
      
      if (habits) {
        // Subscribe to each habit's changes
        habits.forEach(habit => {
          const subscription = habit.changes.subscribe(() => {
            setState(prev => ({ ...prev })); // Force re-render
          });
          subscriptions.add(subscription);
        });
        updateState({ habits, isLoading: false });
      }
    };

    loadHabits();
    return () => subscriptions.forEach(sub => sub.unsubscribe());
  }, [handleAsyncOperation, updateState]);

  const filteredAndSortedHabits = useMemo(() => {
    const { habits, filterType, searchTerm, sortBy, sortDirection } = state;
    return habits
      .filter(habit => 
        (filterType === 'all' || habit.type === filterType) &&
        (!searchTerm || 
          habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          habit.unit?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        const getValue = (habit: HabitEntity) => {
          switch (sortBy) {
            case 'name': return habit.name;
            case 'created': return habit.id;
            case 'lastUpdated': return new Date(parseInt(habit.id)).getTime();
            case 'completion': return habit.isComplete ? 1 : 0;
            default: return habit.name;
          }
        };
        const comparison = String(getValue(a)).localeCompare(String(getValue(b)));
        return sortDirection === 'desc' ? -comparison : comparison;
      });
  }, [state]);

  const refreshHabits = useCallback(() => 
    handleAsyncOperation(
      HabitRegistry.getAll,
      'Failed to refresh habits'
    ).then(habits => habits && updateState({ habits }))
  , [handleAsyncOperation, updateState]);

  // Core operations
  const operations = {
    deleteHabit: useCallback(async () => {
      if (!state.habitToDelete) return;
      await handleAsyncOperation(
        () => HabitRegistry.delete(state.habitToDelete!.id),
        'Failed to delete habit'
      );
      await refreshHabits();
      updateState({ habitToDelete: null });
    }, [state.habitToDelete, handleAsyncOperation, refreshHabits, updateState]),

    export: useCallback(async () => {
      await handleAsyncOperation(
        () => HabitCSVService.exportHabits(state.habits),
        'Failed to export habits',
        'Export completed successfully'
      );
    }, [state.habits, handleAsyncOperation]),

    import: useCallback(async (file: File) => {
      await handleAsyncOperation(
        () => HabitCSVService.importHabits(file),
        'Failed to import habits',
        'Import completed successfully'
      );
      await refreshHabits();
    }, [handleAsyncOperation, refreshHabits]),
  };

  // Form management
  const formAndSelection = {
    openForm: (habit?: HabitEntity) => updateState({
      isFormOpen: true,
      editingHabit: habit || null
    }),

    closeForm: async () => {
      updateState({ isFormOpen: false, editingHabit: null });
      await refreshHabits();
    }
  };

  return {
    // State
    ...state,
    habits: filteredAndSortedHabits,
    
    // Operations
    ...operations,
    ...formAndSelection,
    
    // Filter and sort management
    setFilterType: (filterType: 'all' | Habit.Type) => updateState({ filterType }),
    setSearchTerm: (searchTerm: string) => updateState({ searchTerm }),
    setSortCriteria: (sortBy: Habit.Sort['field'], sortDirection: Habit.Sort['direction']) => 
      updateState({ sortBy, sortDirection }),
    
    // Stats
    getHabitStatistics: (habit: HabitEntity, startDate: Date, endDate: Date) =>
      handleAsyncOperation(
        () => getHabitStats(habit, startDate, endDate),
        'Failed to get habit statistics'
      )
  };
}
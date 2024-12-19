// useHabitManager.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { HabitModel } from './HabitModel';
import { errorHandler } from './ErrorUtils';
import { 
  bulkDeleteHabits, 
  bulkUpdateHabits, 
  duplicateHabit, 
  getHabitStats,
  exportHabitHistoryToCSV,
  importHabitsFromCSV 
} from './HabitOperations';

type SortCriteria = 'name' | 'created' | 'lastUpdated';
type FilterType = 'all' | 'checkbox' | 'quantity';

interface HabitManagerState {
  habits: HabitModel[];
  isFormOpen: boolean;
  editingHabit: HabitModel | null;
  habitToDelete: HabitModel | null;
  selectedHabits: Set<string>;
  isLoading: boolean;
  sortBy: SortCriteria;
  sortDirection: 'asc' | 'desc';
  filterType: FilterType;
  searchTerm: string;
}

export function useHabitManager(initialFilters?: Partial<HabitManagerState>) {
  const [state, setState] = useState<HabitManagerState>({
    habits: [],
    isFormOpen: false,
    editingHabit: null,
    habitToDelete: null,
    selectedHabits: new Set(),
    isLoading: false,
    sortBy: 'created',
    sortDirection: 'desc',
    filterType: 'all',
    searchTerm: '',
    ...initialFilters
  });

  const updateState = useCallback((updates: Partial<HabitManagerState>) => {
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
        HabitModel.getAll,
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
        const getValue = (habit: HabitModel) => {
          switch (sortBy) {
            case 'name': return habit.name;
            case 'created': return habit.id;
            case 'lastUpdated': return new Date(parseInt(habit.id)).getTime();
            default: return habit.name;
          }
        };
        const comparison = String(getValue(a)).localeCompare(String(getValue(b)));
        return sortDirection === 'desc' ? -comparison : comparison;
      });
  }, [state]);

  const refreshHabits = useCallback(() => 
    handleAsyncOperation(
      HabitModel.getAll,
      'Failed to refresh habits'
    ).then(habits => habits && updateState({ habits }))
  , [handleAsyncOperation, updateState]);

  // Core operations
  const operations = {
    deleteHabit: useCallback(async () => {
      if (!state.habitToDelete) return;
      await handleAsyncOperation(
        () => HabitModel.delete(state.habitToDelete!.id),
        'Failed to delete habit'
      );
      await refreshHabits();
      updateState({ habitToDelete: null });
    }, [state.habitToDelete, handleAsyncOperation, refreshHabits, updateState]),

    bulkDelete: useCallback(async () => {
      if (!state.selectedHabits.size) return;
      await handleAsyncOperation(
        () => bulkDeleteHabits(Array.from(state.selectedHabits)),
        'Failed to delete selected habits'
      );
      await refreshHabits();
      updateState({ selectedHabits: new Set() });
    }, [state.selectedHabits, handleAsyncOperation, refreshHabits, updateState]),

    bulkUpdate: useCallback(async (value: number | boolean) => {
      if (!state.selectedHabits.size) return;
      const updates = Array.from(state.selectedHabits).map(id => ({ id, value }));
      await handleAsyncOperation(
        () => bulkUpdateHabits(updates),
        'Failed to update selected habits'
      );
      await refreshHabits();
    }, [state.selectedHabits, handleAsyncOperation, refreshHabits]),

    export: useCallback(async () => {
      await handleAsyncOperation(
        () => exportHabitHistoryToCSV(state.habits),
        'Failed to export habits',
        'Export completed successfully'
      );
    }, [state.habits, handleAsyncOperation]),

    import: useCallback(async (file: File) => {
      await handleAsyncOperation(
        () => importHabitsFromCSV(file),
        'Failed to import habits',
        'Import completed successfully'
      );
      await refreshHabits();
    }, [handleAsyncOperation, refreshHabits]),

    duplicate: useCallback(async (habit: HabitModel) => {
      await handleAsyncOperation(
        () => duplicateHabit(habit),
        'Failed to duplicate habit',
        'Habit duplicated successfully'
      );
      await refreshHabits();
    }, [handleAsyncOperation, refreshHabits])
  };

  // Form and selection management
  const formAndSelection = {
    openForm: (habit?: HabitModel) => updateState({
      isFormOpen: true,
      editingHabit: habit || null
    }),

    closeForm: async () => {
      updateState({ isFormOpen: false, editingHabit: null });
      await refreshHabits();
    },

    toggleSelection: (habitId: string) => {
      const newSelected = new Set(state.selectedHabits);
      newSelected.has(habitId) ? newSelected.delete(habitId) : newSelected.add(habitId);
      updateState({ selectedHabits: newSelected });
    },

    selectAll: () => updateState({
      selectedHabits: new Set(state.habits.map(h => h.id))
    }),

    clearSelection: () => updateState({ selectedHabits: new Set() })
  };

  return {
    // State
    ...state,
    habits: filteredAndSortedHabits,
    
    // Operations
    ...operations,
    ...formAndSelection,
    
    // Filter and sort management
    setFilterType: (filterType: FilterType) => updateState({ filterType }),
    setSearchTerm: (searchTerm: string) => updateState({ searchTerm }),
    setSortCriteria: (sortBy: SortCriteria, sortDirection: 'asc' | 'desc') => 
      updateState({ sortBy, sortDirection }),
    
    // Stats
    getHabitStatistics: (habit: HabitModel, startDate: Date, endDate: Date) =>
      handleAsyncOperation(
        () => getHabitStats(habit, startDate, endDate),
        'Failed to get habit statistics'
      )
  };
}
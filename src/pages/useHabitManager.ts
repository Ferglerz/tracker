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

interface HabitManagerState {
  habits: HabitModel[];
  isFormOpen: boolean;
  editingHabit: HabitModel | null;
  habitToDelete: HabitModel | null;
  selectedHabits: Set<string>;
  isLoading: boolean;
  sortBy: 'name' | 'created' | 'lastUpdated';
  sortDirection: 'asc' | 'desc';
  filterType: 'all' | 'checkbox' | 'quantity';
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

  // Load initial habits and setup subscriptions
  useEffect(() => {
    const subscriptions = new Set<{ unsubscribe: () => void }>();
    
    const loadHabits = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const habits = await HabitModel.getAll();
        
        // Subscribe to each habit's changes
        habits.forEach(habit => {
          const subscription = habit.changes.subscribe(() => {
            setState(prev => ({ ...prev })); // Force re-render on habit changes
          });
          subscriptions.add(subscription);
        });

        setState(prev => ({ ...prev, habits, isLoading: false }));
      } catch (error) {
        errorHandler.handleError(error, 'Failed to load habits');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadHabits();

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  // Filtered and sorted habits
  const filteredAndSortedHabits = useMemo(() => {
    let result = [...state.habits];

    // Apply type filter
    if (state.filterType !== 'all') {
      result = result.filter(h => h.type === state.filterType);
    }

    // Apply search filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      result = result.filter(h => 
        h.name.toLowerCase().includes(term) || 
        h.unit?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (state.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'created':
          comparison = parseInt(a.id) - parseInt(b.id);
          break;
        case 'lastUpdated':
          const aDate = new Date(parseInt(a.id));
          const bDate = new Date(parseInt(b.id));
          comparison = aDate.getTime() - bDate.getTime();
          break;
      }
      return state.sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [state.habits, state.filterType, state.searchTerm, state.sortBy, state.sortDirection]);

  // Core CRUD operations
  const refreshHabits = useCallback(async () => {
    try {
      const habits = await HabitModel.getAll();
      setState(prev => ({ ...prev, habits }));
    } catch (error) {
      errorHandler.handleError(error, 'Failed to refresh habits');
    }
  }, []);

  const handleDeleteHabit = useCallback(async () => {
    if (!state.habitToDelete) return;

    try {
      await HabitModel.delete(state.habitToDelete.id);
      await refreshHabits();
      setState(prev => ({ ...prev, habitToDelete: null }));
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
    }
  }, [state.habitToDelete, refreshHabits]);

  // Bulk operations
  const handleBulkDelete = useCallback(async () => {
    if (!state.selectedHabits.size) return;
    
    try {
      await bulkDeleteHabits(Array.from(state.selectedHabits));
      await refreshHabits();
      setState(prev => ({ ...prev, selectedHabits: new Set() }));
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete selected habits');
    }
  }, [state.selectedHabits, refreshHabits]);

  const handleBulkUpdate = useCallback(async (value: number | boolean) => {
    if (!state.selectedHabits.size) return;

    try {
      const updates = Array.from(state.selectedHabits).map(id => ({ id, value }));
      await bulkUpdateHabits(updates);
      await refreshHabits();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update selected habits');
    }
  }, [state.selectedHabits, refreshHabits]);

  // Form management
  const openForm = useCallback((habit?: HabitModel) => {
    setState(prev => ({
      ...prev,
      isFormOpen: true,
      editingHabit: habit || null
    }));
  }, []);

  const closeForm = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isFormOpen: false,
      editingHabit: null
    }));
    await refreshHabits();
  }, [refreshHabits]);

  // Selection management
  const toggleHabitSelection = useCallback((habitId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedHabits);
      if (newSelected.has(habitId)) {
        newSelected.delete(habitId);
      } else {
        newSelected.add(habitId);
      }
      return { ...prev, selectedHabits: newSelected };
    });
  }, []);

  const selectAllHabits = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedHabits: new Set(prev.habits.map(h => h.id))
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedHabits: new Set() }));
  }, []);

  // Filter and sort management
  const setFilterType = useCallback((filterType: 'all' | 'checkbox' | 'quantity') => {
    setState(prev => ({ ...prev, filterType }));
  }, []);

  const setSearchTerm = useCallback((searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm }));
  }, []);

  const setSortCriteria = useCallback((sortBy: HabitManagerState['sortBy'], sortDirection: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortBy, sortDirection }));
  }, []);

  // Import/Export operations
  const handleExport = useCallback(async () => {
    try {
      await exportHabitHistoryToCSV(state.habits);
      errorHandler.showInfo('Export completed successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to export habits');
    }
  }, [state.habits]);

  const handleImport = useCallback(async (file: File) => {
    try {
      await importHabitsFromCSV(file);
      await refreshHabits();
      errorHandler.showInfo('Import completed successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to import habits');
    }
  }, [refreshHabits]);

  // Utility operations
  const duplicateSelectedHabit = useCallback(async (habit: HabitModel) => {
    try {
      await duplicateHabit(habit);
      await refreshHabits();
      errorHandler.showInfo('Habit duplicated successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to duplicate habit');
    }
  }, [refreshHabits]);

  const getHabitStatistics = useCallback(async (
    habit: HabitModel,
    startDate: Date,
    endDate: Date
  ) => {
    try {
      return await getHabitStats(habit, startDate, endDate);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to get habit statistics');
      return null;
    }
  }, []);

  return {
    // State
    habits: filteredAndSortedHabits,
    isLoading: state.isLoading,
    isFormOpen: state.isFormOpen,
    editingHabit: state.editingHabit,
    habitToDelete: state.habitToDelete,
    selectedHabits: state.selectedHabits,
    filterType: state.filterType,
    searchTerm: state.searchTerm,
    sortBy: state.sortBy,
    sortDirection: state.sortDirection,

    // Core operations
    refreshHabits,
    handleDeleteHabit,
    
    // Bulk operations
    handleBulkDelete,
    handleBulkUpdate,
    
    // Form management
    openForm,
    closeForm,
    
    // Selection management
    toggleHabitSelection,
    selectAllHabits,
    clearSelection,
    
    // Filter and sort management
    setFilterType,
    setSearchTerm,
    setSortCriteria,
    
    // Import/Export
    handleExport,
    handleImport,
    
    // Utility operations
    duplicateSelectedHabit,
    getHabitStatistics
  };
}
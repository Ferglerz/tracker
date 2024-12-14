import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { App } from '@capacitor/app';

// Plugin specific types
interface WidgetConfiguration {
  widgetId: string;
  kind: string;
}

interface StorageResult {
  value?: string;
  error?: string;
}

interface UserDefaultsOptions {
  key: string;
  value: string;
  group: string;
}

// Habit interfaces
export interface Habit {
  id: string;
  name: string;
  type: 'checkbox' | 'quantity';
  unit?: string;
  quantity: number;
  goal?: number;
  isChecked: boolean;
  isComplete: boolean;
  isBegun: boolean;
  bgColor?: string;
}

export interface HabitHistory {
  [habitId: string]: {
    [date: string]: number | boolean;
  };
}

export interface HabitData {
  habits: Habit[];
  history: HabitHistory;
}

// Create a class to handle the cache
class StorageCache {
  private static instance: StorageCache;
  private cache: HabitData | null = null;

  private constructor() {}

  static getInstance(): StorageCache {
    if (!StorageCache.instance) {
      StorageCache.instance = new StorageCache();
    }
    return StorageCache.instance;
  }

  getData(): HabitData | null {
    return this.cache;
  }

  setData(data: HabitData | null): void {
    this.cache = data;
  }

  clear(): void {
    this.cache = null;
  }
}

const storageCache = StorageCache.getInstance();

interface ToastCallback {
  (debugData: string, show: boolean): void;
}

let showDebugToast: ToastCallback | null = null;


// Export everything from a single source
export const HabitStorageAPI = {
  init: async () => {
    try {
      console.log('Initializing HabitStorageAPI...');
      
      // First load the data
      const existingData = await HabitStorageAPI.handleHabitData('load') as HabitData;
      console.log('Initial load during init:', existingData);
      
      // Cache the data
      storageCache.setData(existingData);
      
      // Setup listeners after loading data
      await setupAppStateListener();
      
      if (existingData && existingData.habits.length > 0) {
        console.log('Found existing data, syncing with widgets');
        await syncWithWidgets(existingData);
      }
      
      return existingData;
    } catch (e) {
      console.error('Initialization error:', e);
      throw e;
    }
  },

  setDebugToastCallback: (callback: ToastCallback) => {
    showDebugToast = callback;
  },


  handleHabitData: async (
    action: 'load' | 'save',
    data?: HabitData
  ): Promise<HabitData | void> => {
    const defaultData: HabitData = { habits: [], history: {} };
    const storageKey = 'habitData';
    const storageGroup = 'group.io.ionic.tracker';

    switch (action) {
      case 'load':
        try {
          // Check cache first
          const cachedData = storageCache.getData();
          if (cachedData) {
            console.log('Returning cached data:', cachedData);
            return cachedData;
          }

          console.log('Loading data from storage...');
          const result = await WidgetsBridgePlugin.getItem({
            key: storageKey,
            group: storageGroup
          }) as StorageResult;

          console.log('Raw load result:', result);

          // Handle case where result is empty or undefined
          if (!result || !result.value) {
            console.log('No data in storage, returning default');
            return defaultData;
          }

          try {
            const parsed = JSON.parse(result.value);
            const validatedData: HabitData = {
              habits: Array.isArray(parsed.habits) ? parsed.habits : [],
              history: parsed.history && typeof parsed.history === 'object' ? parsed.history : {}
            };

            // Update cache
            storageCache.setData(validatedData);
            console.log('Loaded and validated data:', validatedData);
            return validatedData;
          } catch (parseError) {
            console.error('Parse error:', parseError);
            return defaultData;
          }

        } catch (e) {
          console.error('Load error:', e);
          return defaultData;
        }

      case 'save':
        if (!data) return;
        try {
          console.log('Starting save operation...');
          
          // Validate and prepare data
          const validData: HabitData = {
            habits: Array.isArray(data.habits) ? data.habits : [],
            history: data.history && typeof data.history === 'object' ? data.history : {}
          };

          // Prepare storage item
          const storageItem = {
            key: storageKey,
            value: JSON.stringify(validData),
            group: storageGroup
          };

          console.log('Saving data:', storageItem);

          // Attempt save
          await WidgetsBridgePlugin.setItem(storageItem);

          // Update cache immediately after successful save
          storageCache.setData(validData);

          // Reload widget timelines
          await WidgetsBridgePlugin.reloadAllTimelines();

          console.log('Save completed successfully');
          return validData;
        } catch (e) {
          console.error('Save error:', e);
          throw e;
        }
    }
  },

  clearCache: () => {
    console.log('Clearing data cache');
    storageCache.clear();
  },

  refreshWidgets: async (): Promise<void> => {
    try {
      console.log('Refreshing widgets...');
      const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
      if (data && data.habits.length > 0) {
        console.log('Found data to sync:', data.habits.length, 'habits');
        await syncWithWidgets(data);
      } else {
        console.log('No data to sync with widgets');
      }
    } catch (e) {
      console.error('Widget refresh error:', e);
    }
  },

  removeWidgetData: async (widgetId: string): Promise<void> => {
    try {
      console.log('Removing widget data...');
      await WidgetsBridgePlugin.removeItem({
        key: 'habitData',
        group: 'group.io.ionic.tracker'
      });
      
      await WidgetsBridgePlugin.reloadAllTimelines();
      storageCache.clear();
      console.log('Widget data removed and timelines reloaded');
    } catch (e) {
      console.error('Remove widget data error:', e);
    }
  },

  getStatusColor: (status: 'complete' | 'partial' | 'none'): string => {
    switch (status) {
      case 'complete':
        return '#2dd36f';
      case 'partial':
        return '#ffc409';
      case 'none':
        return 'transparent';
    }
  },

  debugStorage: async (): Promise<void> => {
    try {
      const result = await WidgetsBridgePlugin.getItem({
        key: 'habitData',
        group: 'group.io.ionic.tracker'
      });
      
      console.log('Debug - Storage contents:', result);
      console.log('Debug - Cache contents:', storageCache.getData());
      
    } catch (e) {
      console.error('Debug - Storage error:', e);
    }
  }
};

// Private helper functions
async function syncWithWidgets(data: HabitData) {
  try {
    console.log('Starting widget sync...');
    
    const storageItem = {
      key: 'habitData',
      value: JSON.stringify(data),
      group: 'group.io.ionic.tracker'
    };

    // Perform save
    await WidgetsBridgePlugin.setItem(storageItem);
    
    // Update cache after successful save
    storageCache.setData(data);

    // Reload timelines
    await WidgetsBridgePlugin.reloadAllTimelines();
    
    console.log('Widget sync completed');
  } catch (e) {
    console.error('Widget sync error:', e);
    throw e;
  }
}

async function setupAppStateListener() {
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      console.log('App became active, refreshing data');
      try {
        await HabitStorageAPI.refreshWidgets();
      } catch (e) {
        console.error('Error refreshing widgets on app state change:', e);
      }
    }
  });
}

// Re-export individual functions for backward compatibility
export const { handleHabitData, refreshWidgets, removeWidgetData, getStatusColor, debugStorage } = HabitStorageAPI;
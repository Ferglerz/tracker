// HabitStorage.ts
import { Storage } from '@ionic/storage';
import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { App } from '@capacitor/app';
import { errorHandler } from './ErrorUtils';
import { validateHabitData } from './HabitUtils';
import { Capacitor } from '@capacitor/core';

// Existing interfaces remain the same
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
  bgColor: string; 
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

interface StorageResult {
  value?: string;
  error?: string;
}

interface StorageOptions {
  key: string;
  group: string;
  value?: string;
}

class StorageCache {
  private static instance: StorageCache;
  private cache: HabitData | null = null;
  private saveQueue: Promise<void> = Promise.resolve();
  private readonly storageKey = 'habitData';
  private readonly storageGroup = 'group.io.ionic.tracker';
  private ionicStorage: Storage | null = null;
  private isNative: boolean;

  private constructor() {
    this.isNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    if (!this.isNative) {
      this.initializeIonicStorage();
    }
  }

  private async initializeIonicStorage() {
    this.ionicStorage = new Storage();
    await this.ionicStorage.create();
  }

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

  private async saveToStorage(data: HabitData): Promise<void> {
    if (this.isNative) {
      const storageItem: StorageOptions = {
        key: this.storageKey,
        value: JSON.stringify(data),
        group: this.storageGroup
      };
      await WidgetsBridgePlugin.setItem(storageItem);
      await WidgetsBridgePlugin.reloadAllTimelines();
    } else {
      if (!this.ionicStorage) {
        await this.initializeIonicStorage();
      }
      await this.ionicStorage!.set(this.storageKey, JSON.stringify(data));
    }
  }

  async save(data: HabitData): Promise<void> {
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        await this.saveToStorage(data);
        this.cache = data;
      } catch (error) {
        errorHandler.handleError(error, 'Failed to save habit data');
        throw error;
      }
    });

    await this.saveQueue;
  }

  async load(): Promise<HabitData> {
    try {
      if (this.cache) {
        return this.cache;
      }

      let rawData: string | null = null;

      if (this.isNative) {
        const result = await WidgetsBridgePlugin.getItem({
          key: this.storageKey,
          group: this.storageGroup
        }) as StorageResult;
        rawData = result?.value || null;
      } else {
        if (!this.ionicStorage) {
          await this.initializeIonicStorage();
        }
        rawData = await this.ionicStorage!.get(this.storageKey);
      }

      if (!rawData) {
        const defaultData: HabitData = { habits: [], history: {} };
        this.cache = defaultData;
        return defaultData;
      }

      const parsed = JSON.parse(rawData);
      const validatedData: HabitData = {
        habits: Array.isArray(parsed.habits) 
          ? parsed.habits.filter(validateHabitData)
          : [],
        history: parsed.history && typeof parsed.history === 'object' 
          ? parsed.history 
          : {}
      };

      this.cache = validatedData;
      return validatedData;
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habit data');
      const defaultData: HabitData = { habits: [], history: {} };
      this.cache = defaultData;
      return defaultData;
    }
  }

  clear(): void {
    this.cache = null;
  }
}

// Private helper functions
const syncWithWidgets = async (storage: StorageCache, data: HabitData): Promise<void> => {
  try {
    await storage.save(data);
  } catch (error) {
    errorHandler.handleError(error, 'Failed to sync with widgets');
    throw error;
  }
};

const setupAppStateListener = async (refreshWidgets: () => Promise<void>): Promise<void> => {
  App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
      try {
        await refreshWidgets();
      } catch (error) {
        errorHandler.handleError(error, 'Failed to refresh widgets on app state change');
      }
    }
  });
};

export const HabitStorageAPI = {
  storage: StorageCache.getInstance(),

  async init(): Promise<HabitData> {
    try {
      const data = await this.storage.load();
      await setupAppStateListener(this.refreshWidgets.bind(this));
      if (data.habits.length > 0) {
        await syncWithWidgets(this.storage, data);
      }
      return data;
    } catch (error) {
      errorHandler.handleError(error, 'Failed to initialize habit storage');
      throw error;
    }
  },

  async handleHabitData(
    action: 'load' | 'save',
    data?: HabitData
  ): Promise<HabitData> {
    switch (action) {
      case 'load':
        return this.storage.load();
      
      case 'save':
        if (!data) {
          throw new Error('No data provided for save operation');
        }
        await this.storage.save(data);
        return data;
      
      default:
        throw new Error(`Invalid storage action: ${action}`);
    }
  },

  async refreshWidgets(): Promise<void> {
    try {
      const data = await this.storage.load();
      if (data.habits.length > 0) {
        await syncWithWidgets(this.storage, data);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to refresh widgets');
    }
  },

  async removeWidgetData(widgetId: string): Promise<void> {
    try {
      await WidgetsBridgePlugin.removeItem({
        key: 'habitData',
        group: 'group.io.ionic.tracker'
      });
      
      await WidgetsBridgePlugin.reloadAllTimelines();
      this.storage.clear();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to remove widget data');
    }
  }
};

export const { handleHabitData, refreshWidgets, removeWidgetData } = HabitStorageAPI;

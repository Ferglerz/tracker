// HabitStorage.ts
import { Storage } from '@ionic/storage';
import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { App } from '@capacitor/app';
import { errorHandler } from './ErrorUtils';
import { validateHabitData } from './HabitUtils';
import { Capacitor } from '@capacitor/core';
import { Habit } from './HabitTypes';

// Plugin interface types
interface UserDefaultsOptions {
  key: string;
  group: string;
}

interface DataResults<T> {
  value: T;
  error?: string;
}

interface StorageOptions {
  key: string;
  group: string;
  value?: string;
}

interface WidgetsBridgePluginInterface {
  getItem(options: UserDefaultsOptions): Promise<DataResults<any>>;
  setItem(options: StorageOptions): Promise<void>;
  removeItem(options: UserDefaultsOptions): Promise<void>;
  reloadAllTimelines(): Promise<void>;
}

// Strategy Pattern for different storage implementations
interface StorageStrategy {
  save(key: string, value: string): Promise<void>;
  load(key: string): Promise<string | null>;
  clear(key: string): Promise<void>;
}

// Native Storage Strategy
class NativeStorageStrategy implements StorageStrategy {
  constructor(private group: string) {}

  async save(key: string, value: string): Promise<void> {
    try {
      await WidgetsBridgePlugin.setItem({
        key,
        value,
        group: this.group
      });
      await WidgetsBridgePlugin.reloadAllTimelines();
    } catch (error) {
      console.error('Failed to save to native storage:', error);
      throw error;
    }
  }

  async load(key: string): Promise<string | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await WidgetsBridgePlugin.getItem({
        key,
        group: this.group
      });
      return typeof result === 'string' ? result : null;
    } catch (error) {
      console.error('Failed to load from native storage:', error);
      return null;
    }
  }

  async clear(key: string): Promise<void> {
    await WidgetsBridgePlugin.removeItem({
      key,
      group: this.group
    });
    await WidgetsBridgePlugin.reloadAllTimelines();
  }
}

// Ionic Storage Strategy
class IonicStorageStrategy implements StorageStrategy {
  private storage: Storage | null = null;

  async initialize(): Promise<void> {
    if (!this.storage) {
      this.storage = new Storage();
      await this.storage.create();
    }
  }

  async save(key: string, value: string): Promise<void> {
    await this.initialize();
    await this.storage!.set(key, value);
  }

  async load(key: string): Promise<string | null> {
    await this.initialize();
    return this.storage!.get(key);
  }

  async clear(key: string): Promise<void> {
    await this.initialize();
    await this.storage!.remove(key);
  }
}

// Observer Pattern for widget updates
interface WidgetObserver {
  update(data: Habit.Data): Promise<void>;
}

class WidgetSyncObserver implements WidgetObserver {
  async update(data: Habit.Data): Promise<void> {
    try {
      if (data.habits.length > 0) {
        await HabitStorage.getInstance().save(data);
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to sync with widgets');
    }
  }
}

// Main Storage Class
export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private cache: Habit.Data | null = null;
  private observers: WidgetObserver[] = [];
  private saveQueue: Promise<void> = Promise.resolve();
  private readonly storageKey = 'habitData';

  private constructor() {
    const isNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    this.storage = isNative 
      ? new NativeStorageStrategy('group.io.ionic.tracker')
      : new IonicStorageStrategy();
    
    this.setupAppStateListener();
  }

  static getInstance(): HabitStorage {
    if (!this.instance) {
      this.instance = new HabitStorage();
    }
    return this.instance;
  }

  addObserver(observer: WidgetObserver): void {
    this.observers.push(observer);
  }

  private async notifyObservers(data: Habit.Data): Promise<void> {
    for (const observer of this.observers) {
      await observer.update(data);
    }
  }

  private async setupAppStateListener(): Promise<void> {
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        try {
          await this.refresh();
        } catch (error) {
          errorHandler.handleError(error, 'Failed to refresh on app state change');
        }
      }
    });

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      const intervalId = setInterval(async () => {
        try {
          const newData = await this.storage.load(this.storageKey);
          if (newData && this.cache) {
            const currentData = JSON.stringify(this.cache);
            const newDataStr = JSON.stringify(JSON.parse(newData));
            
            if (currentData !== newDataStr) {
              const parsedData = JSON.parse(newData) as Habit.Data;
              this.cache = parsedData;
              await this.notifyObservers(parsedData);
            }
          }
        } catch (error) {
          console.error('Error checking UserDefaults changes:', error);
        }
      }, 1000);

      App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) {
          clearInterval(intervalId);
        }
      });
    }
  }

  async save(data: Habit.Data): Promise<void> {
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        await this.storage.save(this.storageKey, JSON.stringify(data));
        this.cache = data;
        await this.notifyObservers(data);
      } catch (error) {
        errorHandler.handleError(error, 'Failed to save habit data');
        throw error;
      }
    });

    await this.saveQueue;
  }

  async load(): Promise<Habit.Data> {
    try {
      if (this.cache) {
        return this.cache;
      }

      const rawData = await this.storage.load(this.storageKey);
      if (!rawData) {
        return this.getDefaultData();
      }

      const parsed = JSON.parse(rawData);
      const validatedData: Habit.Data = {
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
      return this.getDefaultData();
    }
  }

  private getDefaultData(): Habit.Data {
    const defaultData: Habit.Data = { habits: [], history: {} };
    this.cache = defaultData;
    return defaultData;
  }

  async refresh(): Promise<void> {
    const data = await this.load();
    await this.notifyObservers(data);
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storageKey);
    this.cache = null;
  }
}

// Public API
export const HabitStorageAPI = {
  async init(): Promise<Habit.Data> {
    const storage = HabitStorage.getInstance();
    storage.addObserver(new WidgetSyncObserver());
    return storage.load();
  },

  async handleHabitData(
    action: 'load' | 'save',
    data?: Habit.Data
  ): Promise<Habit.Data> {
    const storage = HabitStorage.getInstance();
    
    switch (action) {
      case 'load':
        return storage.load();
      case 'save':
        if (!data) {
          throw new Error('No data provided for save operation');
        }
        await storage.save(data);
        return data;
      default:
        throw new Error(`Invalid storage action: ${action}`);
    }
  },

  refreshWidgets: () => HabitStorage.getInstance().refresh(),
  removeWidgetData: () => HabitStorage.getInstance().clear()
};

export const { handleHabitData, refreshWidgets, removeWidgetData } = HabitStorageAPI;
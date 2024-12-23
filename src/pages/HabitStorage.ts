import { Storage } from '@ionic/storage';
import { WidgetsBridgePlugin, DataResults } from 'capacitor-widgetsbridge-plugin'; 
import { App } from '@capacitor/app';
import { errorHandler } from './ErrorUtils';
import { Capacitor } from '@capacitor/core';
import { Habit } from './HabitTypes';

// Type guard function with improved validation
function isHabitData(data: any): data is Habit.Data {
  return data && typeof data === 'object' && 'habits' in data && 'history' in data;
}

// Strategy Pattern for different storage implementations
interface StorageStrategy {
  save(key: string, value: Habit.Data): Promise<void>;
  load(key: string): Promise<Habit.Data | null>;
  clear(key: string): Promise<void>;
}

// Native Storage Strategy with improved error handling and queuing
class NativeStorageStrategy implements StorageStrategy {
  private loadQueue: Promise<void> = Promise.resolve();
  private saveQueue: Promise<void> = Promise.resolve();
  private loadCounter: number = 0;

  constructor(private group: string) {}

  async save(key: string, value: Habit.Data): Promise<void> {
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        await WidgetsBridgePlugin.setItem({
          key: String(key),
          value: JSON.stringify(value), // Stringify the value
          group: String(this.group)
        });
        
        // Ensure widget refresh
        await WidgetsBridgePlugin.reloadAllTimelines();
      } catch (error) {
        console.error('Failed to save to native storage:', error);
        throw error;
      }
    });
    return this.saveQueue;
  }

  async load(key: string): Promise<Habit.Data | null> {
    return new Promise(async (resolve) => {
      this.loadQueue = this.loadQueue.then(async () => {
        try {
          this.loadCounter++;
          const timestamp = new Date().getTime();
          const stack = new Error().stack?.split('\n')[2] || 'unknown';
          console.log(`Loading from native storage (call #${this.loadCounter}) at ${timestamp}\nCaller: ${stack}\nKey: ${key}`);

          const result = await WidgetsBridgePlugin.getItem({
            key: String(key),
            group: String(this.group)
          });

          if (result && result.results) {
            try {
              // Attempt to parse the result
              const parsedResult = JSON.parse(result.results); 
              if (isHabitData(parsedResult)) {
                resolve(parsedResult);
              } else {
                console.warn("Loaded data is not valid Habit.Data. Returning default data.");
                resolve(this.getDefaultData());
              }
            } catch (parseError) {
              console.error("Failed to parse data from native storage:", parseError);
              resolve(this.getDefaultData());
            }
          } else {
            console.warn("Loaded data is null. Returning default data.");
            resolve(this.getDefaultData());
          }
        } catch (error) {
          console.error(`Native storage load error (call #${this.loadCounter}):`, error);
          resolve(this.getDefaultData());
        }
      });
    });
  }

  async clear(key: string): Promise<void> {
    await WidgetsBridgePlugin.removeItem({
      key: String(key),
      group: String(this.group)
    });
    await WidgetsBridgePlugin.reloadAllTimelines();
  }

  private getDefaultData(): Habit.Data {
    return { habits: [], history: {} };
  }
}

// Ionic Storage Strategy with improved initialization
class IonicStorageStrategy implements StorageStrategy {
  private storage: Storage | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        if (!this.storage) {
          this.storage = new Storage();
          await this.storage.create();
        }
      })();
    }
    return this.initPromise;
  }

  async save(key: string, value: Habit.Data): Promise<void> {
    await this.initialize();
    await this.storage!.set(key, JSON.stringify(value)); // Keep stringify for IonicStorage
  }

  async load(key: string): Promise<Habit.Data | null> {
    await this.initialize();
    const result = await this.storage!.get(key);
    return result ? JSON.parse(result) : null; // Keep parse for IonicStorage
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
      await HabitStorage.getInstance().save(data);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to sync with widgets');
    }
  }
}

// Main Storage Class with improved synchronization
export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private cache: Habit.Data | null = null;
  private observers: WidgetObserver[] = [];
  private saveQueue: Promise<void> = Promise.resolve();
  private readonly storageKey = 'habitData';
  private pollInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    const isNativePlatform = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const isNative = isNativePlatform && platform === 'ios';
    
    this.storage = isNative 
      ? new NativeStorageStrategy('group.io.ionic.tracker')
      : new IonicStorageStrategy();
    
    this.setupAppStateListener();
    this.setupPolling();
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

  private setupPolling(): void {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      this.pollInterval = setInterval(async () => {
        try {
          const newData = await this.storage.load(this.storageKey);
          if (newData) {
            // Initialize cache if it's null
            if (!this.cache) {
              this.cache = newData;
              await this.notifyObservers(newData);
              return;
            }
            
            const currentData = JSON.stringify(this.cache);
            const newDataStr = JSON.stringify(newData);
            
            if (currentData !== newDataStr && isHabitData(newData)) {
              console.log('Data changed in UserDefaults, updating app...');
              this.cache = newData;
              await this.notifyObservers(newData);
            }
          }
        } catch (error) {
          console.error('Error checking UserDefaults changes:', error);
        }
      }, 1000);
    }
  }

  private async setupAppStateListener(): Promise<void> {
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        try {
          // Clear cache to force reload
          this.cache = null;
          await this.refresh();
        } catch (error) {
          errorHandler.handleError(error, 'Failed to refresh on app state change');
        }
      }
    });
  }

  async save(data: Habit.Data): Promise<void> {
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        if (!isHabitData(data)) { throw new Error('Invalid habit data structure'); }
        
        await this.storage.save(this.storageKey, data);
        this.cache = data;
        await this.notifyObservers(data);
        
        // Force widget refresh after save
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
          await WidgetsBridgePlugin.reloadAllTimelines();
        }
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

      const data = await this.storage.load(this.storageKey);

      if (!data) {
        const defaultData = this.getDefaultData();
        this.cache = defaultData;
        return defaultData;
      }

      if (!isHabitData(data)) {
        console.warn("Loaded data is not valid Habit.Data. Returning default data.");
        const defaultData = this.getDefaultData();
        this.cache = defaultData;
        return defaultData;
      }

      this.cache = data;
      return data;
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habit data');
      const defaultData = this.getDefaultData();
      this.cache = defaultData;
      return defaultData;
    }
  }

  private getDefaultData(): Habit.Data {
    return { habits: [], history: {} };
  }

  async refresh(): Promise<void> {
    this.cache = null;  // Clear cache to force reload
    const data = await this.load();
    await this.notifyObservers(data);
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storageKey);
    this.cache = null;
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      await WidgetsBridgePlugin.reloadAllTimelines();
    }
  }

  // Cleanup method to clear intervals
  destroy(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
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
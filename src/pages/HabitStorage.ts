import { Storage } from '@ionic/storage';
import { WidgetsBridgePlugin, DataResults } from 'capacitor-widgetsbridge-plugin'; 
import { App } from '@capacitor/app';
import { errorHandler } from './ErrorUtils';
import { Capacitor } from '@capacitor/core';
import { Habit } from './HabitTypes';


// Plugin interface types
interface UserDefaultsOptions {
  key: string;
  group: string;
}

interface StorageOptions {
  key: string;
  group: string;
  value?: string;
}


// Type guard function - simplified to check for the existence of properties
function isHabitData(data: any): data is Habit.Data {
  return data && typeof data === 'object' && 'habits' in data && 'history' in data;
}

// Strategy Pattern for different storage implementations
interface StorageStrategy {
  save(key: string, value: string): Promise<void>;
  load(key: string): Promise<DataResults<string> | null>;  
  clear(key: string): Promise<void>;
}

// Native Storage Strategy
class NativeStorageStrategy implements StorageStrategy {
  constructor(private group: string) {}

  private loadCounter: number = 0;
  private loadLock: Promise<void> = Promise.resolve(); 

  async save(key: string, value: string): Promise<void> {
    try {
      await WidgetsBridgePlugin.setItem({
        key,
        value,
        group: this.group
      });

      await WidgetsBridgePlugin.reloadAllTimelines();
    } catch (error) {
      alert('Failed to save to native storage: ' + error);
      throw error;
    }
  }

  async load(key: string): Promise<DataResults<string>> {
    return new Promise(async (resolve) => {
      this.loadLock = this.loadLock.then(async () => {
        try {
          this.loadCounter++;
          const timestamp = new Date().getTime();
          const stack = new Error().stack?.split('\n')[2] || 'unknown';
          console.log(`Loading from native storage (call #${this.loadCounter}) at ${timestamp}\nCaller: ${stack}\nKey: ${key}`);
  
          const result = await WidgetsBridgePlugin.getItem({
            key,
            group: this.group
          });
  
          if (result) {
            resolve(result as DataResults<string>);
          } else {
            resolve({ results: JSON.stringify(this.getDefaultData()) });
          }
        } catch (error) {
          console.error(`Native storage load error (call #${this.loadCounter}):`, error);
          resolve({ results: JSON.stringify(this.getDefaultData()) });
        }
      });
    });
  }

  async clear(key: string): Promise<void> {
    await WidgetsBridgePlugin.removeItem({
      key,
      group: this.group
    });
    await WidgetsBridgePlugin.reloadAllTimelines();
  }

  private getDefaultData(): Habit.Data {
    return { habits: [], history: {} };
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

  async load(key: string): Promise<DataResults<string> | null> { 
    await this.initialize();
    const value = await this.storage!.get(key);
    return value ? { results: value } : null;
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
    const isNativePlatform = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    const isNative = isNativePlatform && platform === 'ios';
    
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
          const newDataResult = await this.storage.load(this.storageKey);
          if (newDataResult && this.cache) {
            const currentData = JSON.stringify(this.cache);
            const newData = JSON.parse(newDataResult.results);
            const newDataStr = JSON.stringify(newData);
            
            if (currentData !== newDataStr) {
              this.cache = newData;
              await this.notifyObservers(newData);
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
        const dataString = JSON.stringify(data);
        await this.storage.save(this.storageKey, dataString);
        this.cache = data;
        await this.notifyObservers(data);
      } catch (error) {
        errorHandler.handleError(error, 'Failed to save habit data');
        throw error;
      }
    });
    await this.saveQueue;
  }

  private static getDefaultData(): Habit.Data {
    return { habits: [], history: {} };
  }

  async load(): Promise<Habit.Data> {
    try {
      if (this.cache) {
        return this.cache;
      }

      const rawData = await this.storage.load(this.storageKey);

      if (!rawData || !rawData.results) {
        return HabitStorage.getDefaultData();
      }

      let parsedData: Habit.Data | null = null;
      try {
        parsedData = JSON.parse(rawData.results);
      } catch (e) {
        console.error("Error parsing data from storage:", e);
      }

      if (!isHabitData(parsedData)) {
        console.warn("Loaded data is not valid Habit.Data. Returning default data.");
        return HabitStorage.getDefaultData();
      }

      this.cache = parsedData;
      return parsedData;

    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habit data');
      return HabitStorage.getDefaultData();
    }
  }

  private getDefaultData(): Habit.Data {
    return { habits: [], history: {} };
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
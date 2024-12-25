// HabitStorage.ts
import { Storage } from '@ionic/storage';
import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin'; 
import { App } from '@capacitor/app';
import { errorHandler } from './ErrorUtils';
import { Capacitor } from '@capacitor/core';
import { Habit } from './HabitTypes';

function isHabitData(data: any): data is Habit.Data {
  return data && 
         typeof data === 'object' && 
         Array.isArray(data.habits) &&
         data.habits.every((habit: any) => 
           habit && 
           typeof habit === 'object' && 
           typeof habit.id === 'string' &&
           typeof habit.name === 'string' &&
           (habit.type === 'checkbox' || habit.type === 'quantity') &&
           typeof habit.history === 'object'
         );
}

interface StorageStrategy {
  save(key: string, value: Habit.Data): Promise<void>;
  load(key: string): Promise<Habit.Data | null>;
  clear(key: string): Promise<void>;
}

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
          value: JSON.stringify(value),
          group: String(this.group)
        });
        
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
    return { habits: [] };
  }
}

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
    await this.storage!.set(key, JSON.stringify(value));
  }

  async load(key: string): Promise<Habit.Data | null> {
    await this.initialize();
    const result = await this.storage!.get(key);
    return result ? JSON.parse(result) : null;
  }

  async clear(key: string): Promise<void> {
    await this.initialize();
    await this.storage!.remove(key);
  }
}

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

export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private cache: Habit.Data | null = null;
  private observers: WidgetObserver[] = [];
  private saveQueue: Promise<void> = Promise.resolve();
  private readonly storageKey = 'habitData';
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private initPromise: Promise<void>;

  private constructor() {
    const isNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    this.storage = isNative 
      ? new NativeStorageStrategy('group.io.ionic.tracker')
      : new IonicStorageStrategy();
    
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.storage.load(this.storageKey);
      this.setupAppStateListener();
      this.setupPolling();
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
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

  removeObserver(observer: WidgetObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  async notifyObservers(data: Habit.Data): Promise<void> {
    for (const observer of this.observers) {
      await observer.update(data);
    }
  }

  private setupPolling(): void {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      this.pollInterval = setInterval(async () => {
        try {
          const newData = await this.storage.load(this.storageKey);
          if (newData && (!this.cache || JSON.stringify(this.cache) !== JSON.stringify(newData))) {
            console.log('Data changed in UserDefaults, updating app...');
            this.cache = newData;
            await this.notifyObservers(newData);
          }
        } catch (error) {
          console.error('Error checking UserDefaults changes:', error);
        }
      }, 1000);
    }
  }

  private setupAppStateListener(): void {
    App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        try {
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
        if (!isHabitData(data)) {
          throw new Error('Invalid habit data structure');
        }
        
        await this.storage.save(this.storageKey, data);
        this.cache = data;
        await this.notifyObservers(data);
        
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
      await this.initPromise;

      if (this.cache) {
        return this.cache;
      }

      const data = await this.storage.load(this.storageKey);
      const defaultData = { habits: [] };

      if (!data || !isHabitData(data)) {
        this.cache = defaultData;
        return defaultData;
      }

      this.cache = data;
      return data;
    } catch (error) {
      console.error('Failed to load habit data:', error);
      const defaultData = { habits: [] };
      this.cache = defaultData;
      return defaultData;
    }
  }

  async refresh(): Promise<void> {
    this.cache = null;
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

  destroy(): void {
    if (this.pollInterval !== null) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

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
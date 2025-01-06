// HabitStorage.ts
import { Storage } from '@ionic/storage';
import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { errorHandler } from './ErrorUtilities';
import { Capacitor } from '@capacitor/core';
import { Habit } from './Types';
import { Subject, Observable } from 'rxjs';

interface StorageStrategy {
  save(key: string, value: Habit.Data): Promise<void>;
  load(key: string): Promise<Habit.Data | null>;
  clear(key: string): Promise<void>;
}

class NativeStorageStrategy implements StorageStrategy {
  constructor(private group: string) { }

  async save(key: string, value: Habit.Data): Promise<void> {
    try {
      await WidgetsBridgePlugin.setItem({
        key: String(key),
        value: JSON.stringify(value),
        group: String(this.group)
      });

      await WidgetsBridgePlugin.reloadAllTimelines();
      //alert('Saved to native storage: ' + key + ' - ' + JSON.stringify(value));
    } catch (error) {
      alert('Failed to save to native storage:' + error);
      throw error;
    }
  }

  async load(key: string): Promise<Habit.Data | null> {
    try {
      const result = await WidgetsBridgePlugin.getItem({
        key: String(key),
        group: String(this.group)
      });

      if (result && result.results) {
        try {
          const parsedResult = JSON.parse(result.results);
          return parsedResult;
        } catch (parseError) {
          console.error("Failed to parse data from native storage:", parseError);
          return this.getDefaultData();
        }
      } else {
        console.warn("Loaded data is null. Returning default data.");
        return this.getDefaultData();
      }
    } catch (error) {
      console.error(`Native storage load error:`, error); 
      return this.getDefaultData();
    }
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

export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private readonly storageKey = 'habitData';
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private initPromise: Promise<void>;
  private storageSubject = new Subject<Habit.Data>();

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

  async save(data: Habit.Data): Promise<void> {
    try {
      await this.storage.save(this.storageKey, data);
      this.storageSubject.next(data);

      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        await WidgetsBridgePlugin.reloadAllTimelines();
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to save habit data');
      throw error;
    }
  }
  
  get changes(): Observable<Habit.Data> {
    return this.storageSubject.asObservable();
  }

  async load(): Promise<Habit.Data> {
    try {
      await this.initPromise;
      
      const data = await this.storage.load(this.storageKey);
      if (!data) {
        return { habits: [] };
      }

      return data;
    } catch (error) {
      console.error('Failed to load habit data:', error);
      return { habits: [] };
    }
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  async clear(): Promise<void> {
    await this.storage.clear(this.storageKey);
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
    return storage.load();
  },

  async handleHabitData(action: 'load' | 'save', data?: Habit.Data): Promise<Habit.Data> {
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
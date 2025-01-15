import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { Capacitor } from '@capacitor/core';
import { Habit, StorageStrategy } from '@utils/TypesAndProps';
import { IonicStorageStrategy } from '@utils/IonicStorageStrategy';
import { NativeStorageStrategy } from '@utils/NativeStorageStrategy';
import { CONSTANTS } from '@utils/Constants';

export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private initPromise: Promise<void>;

  private constructor() {
    const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    this.storage = isNativeIOS
      ? new NativeStorageStrategy(CONSTANTS.STORAGE.GROUP)
      : new IonicStorageStrategy();

    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.storage.load(CONSTANTS.STORAGE.HABITS_KEY);
    } catch (error) {
      console.error('Storage initialization failed:', error);
      throw error;
    }
  }

  private async handleStorageOperation<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      await this.initPromise;
      return await operation();
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      if (error instanceof Error) {
        throw new Error(`${errorMessage}: ${error.message}`);
      }
      throw new Error(errorMessage);
    }
  }

  static getInstance(): HabitStorage {
    if (!this.instance) {
      this.instance = new HabitStorage();
    }
    return this.instance;
  }

  private async updateWidgets(): Promise<void> {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
      await WidgetsBridgePlugin.reloadAllTimelines();
    }
  }

  async save(data: Habit.Data): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        await this.storage.save(CONSTANTS.STORAGE.HABITS_KEY, data);
        await this.updateWidgets();
      },
      'Failed to save habit data'
    );
  }

  async load(): Promise<Habit.Data> {
    return this.handleStorageOperation(
      async () => {
        const data = await this.storage.load(CONSTANTS.STORAGE.HABITS_KEY);
        return data || { habits: [] };
      },
      'Failed to load habit data'
    );
  }

  async saveSettings(settings: any): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        await this.storage.save(CONSTANTS.STORAGE.SETTINGS_KEY, settings);
      },
      'Failed to save settings'
    );
  }

  async loadSettings(): Promise<any> {
    return this.handleStorageOperation(
      async () => {
        const settings = await this.storage.load(CONSTANTS.STORAGE.SETTINGS_KEY);
        return settings || {};
      },
      'Failed to load settings'
    );
  }

  async refresh(): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        await this.load();
      },
      'Failed to refresh storage'
    );
  }

  async clear(): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        await this.storage.clear(CONSTANTS.STORAGE.HABITS_KEY);
        await this.updateWidgets();
      },
      'Failed to clear storage'
    );
  }
}

export const HabitStorageWrapper = {
  async handleHabitData(
    action: 'load' | 'save',
    data?: Habit.Data,
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

  async handleSettings(
    action: 'load' | 'save',
    settings?: any,
  ): Promise<any> {
    const storage = HabitStorage.getInstance();

    switch (action) {
      case 'load':
        return storage.loadSettings();
      case 'save':
        if (!settings) {
          throw new Error('No settings provided for save operation');
        }
        await storage.saveSettings(settings);
        return settings;
      default:
        throw new Error(`Invalid settings action: ${action}`);
    }
  },

  refreshWidgets: () => HabitStorage.getInstance().refresh(),
  removeWidgetData: () => HabitStorage.getInstance().clear(),
};

export const { handleHabitData, handleSettings, refreshWidgets, removeWidgetData } = HabitStorageWrapper;
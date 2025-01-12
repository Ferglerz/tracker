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
    try {
      await this.initPromise;
      await this.storage.save(CONSTANTS.STORAGE.HABITS_KEY, data);

      await this.updateWidgets();
    } catch (error) {
      console.error('Storage save failed:', error);
      throw error;
    }
  }


  async load(): Promise<Habit.Data> {
    try {
      await this.initPromise;
      const data = await this.storage.load(CONSTANTS.STORAGE.HABITS_KEY);
      return data || { habits: [] };
    } catch (error) {
      console.error('Storage load failed:', error);
      return { habits: [] };
    }
  }

  async saveSettings(settings: any): Promise<void> {
    try {
      await this.initPromise;
      await this.storage.save(CONSTANTS.STORAGE.SETTINGS_KEY, settings);
    } catch (error) {
      console.error('Settings save failed:', error);
      throw error;
    }
  }

  async loadSettings(): Promise<any> {
    try {
      await this.initPromise;
      const settings = await this.storage.load(CONSTANTS.STORAGE.SETTINGS_KEY);
      return settings || {};
    } catch (error) {
      console.error('Settings load failed:', error);
      return {};
    }
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear(CONSTANTS.STORAGE.HABITS_KEY);
      await this.updateWidgets();
    } catch (error) {
      console.error('Storage clear failed:', error);
      throw error;
    }
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
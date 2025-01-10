import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { Capacitor } from '@capacitor/core';
import { Habit, StorageStrategy } from '@utils/TypesAndProps';
import { IonicStorageStrategy } from '@utils/IonicStorageStrategy';
import { NativeStorageStrategy } from '@utils/NativeStorageStrategy';
import { CONSTANTS } from '@utils/Constants';

type HabitCallback = () => void;

export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private habitChangeCallbacks: Map<string, Set<HabitCallback>>;
  private initPromise: Promise<void>;

  private constructor() {
    const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    this.storage = isNativeIOS
      ? new NativeStorageStrategy(CONSTANTS.STORAGE.GROUP)
      : new IonicStorageStrategy();

    this.habitChangeCallbacks = new Map();
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.storage.load(CONSTANTS.STORAGE.KEY);
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

  async save(data: Habit.Data, changedHabitId?: string): Promise<void> {
    try {
      await this.initPromise;
      await this.storage.save(CONSTANTS.STORAGE.KEY, data);

      if (changedHabitId) {
        this.habitChangeCallbacks.get(changedHabitId)?.forEach(callback => callback());
      }

      await this.updateWidgets();
    } catch (error) {
      console.error('Storage save failed:', error);
      throw error;
    }
  }

  async load(): Promise<Habit.Data> {
    try {
      await this.initPromise;
      const data = await this.storage.load(CONSTANTS.STORAGE.KEY);
      return data || { habits: [] };
    } catch (error) {
      console.error('Storage load failed:', error);
      return { habits: [] };
    }
  }

  async refresh(): Promise<void> {
    await this.load();
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clear(CONSTANTS.STORAGE.KEY);
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
    changedHabitId?: string
  ): Promise<Habit.Data> {
    const storage = HabitStorage.getInstance();

    switch (action) {
      case 'load':
        return storage.load();
      case 'save':
        if (!data) {
          throw new Error('No data provided for save operation');
        }
        await storage.save(data, changedHabitId);
        return data;
      default:
        throw new Error(`Invalid storage action: ${action}`);
    }
  },

  refreshWidgets: () => HabitStorage.getInstance().refresh(),
  removeWidgetData: () => HabitStorage.getInstance().clear()
};

export const { handleHabitData, refreshWidgets, removeWidgetData } = HabitStorageWrapper;
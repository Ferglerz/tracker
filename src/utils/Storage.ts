// HabitStorage.ts
import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { Capacitor } from '@capacitor/core';
import { Habit, StorageStrategy } from '@utils/TypesAndProps';
import { IonicStorageStrategy } from '@utils/IonicStorageStrategy';
import { NativeStorageStrategy } from '@utils/NativeStorageStrategy';

export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private readonly storageKey = 'habitData';
  private initPromise: Promise<void>;
  private habitChangeCallbacks = new Map<string, Set<() => void>>();

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

  registerHabitCallback(habitId: string, callback: () => void) {
    if (!this.habitChangeCallbacks.has(habitId)) {
      this.habitChangeCallbacks.set(habitId, new Set());
    }
    this.habitChangeCallbacks.get(habitId)?.add(callback);
  }

  unregisterHabitCallback(habitId: string, callback: () => void) {
    this.habitChangeCallbacks.get(habitId)?.delete(callback);
    if (this.habitChangeCallbacks.get(habitId)?.size === 0) {
      this.habitChangeCallbacks.delete(habitId);
    }
  }

  async save(data: Habit.Data, changedHabitId?: string): Promise<void> {
    try {
      await this.storage.save(this.storageKey, data);

      // If we know which habit changed, only notify its callbacks
      if (changedHabitId) {
        this.habitChangeCallbacks.get(changedHabitId)?.forEach(callback => callback());
      }

      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        await WidgetsBridgePlugin.reloadAllTimelines();
      }
    } catch (error) {
      console.error('Failed to save habit data:', error);
      throw error;
    }
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
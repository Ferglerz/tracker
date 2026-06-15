import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { Capacitor } from '@capacitor/core';
import { Habit, StorageStrategy, AppSettings } from '@utils/TypesAndProps';
import { IonicStorageStrategy } from '@utils/IonicStorageStrategy';
import { NativeStorageStrategy } from '@utils/NativeStorageStrategy';
import { CONSTANTS } from '@utils/Constants';

export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private initPromise: Promise<void>;
  private isNativeIOS: boolean;

  private habitCache: Habit.Data | null = null;
  private settingsCache: AppSettings | null = null;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 300;

  private constructor() {
    this.isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
    this.storage = this.isNativeIOS
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

  async save(data: Habit.Data): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        this.habitCache = data;
        this.debouncedSave(data);
      },
      'Failed to save habit data'
    );
  }

  private debouncedSave(data: Habit.Data): void {
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(async () => {
      try {
        await this.storage.save(CONSTANTS.STORAGE.HABITS_KEY, data);
        if (this.isNativeIOS) {
          await WidgetsBridgePlugin.reloadAllTimelines();
        }
      } catch (error) {
        console.error('Debounced save failed:', error);
      }
    }, this.DEBOUNCE_MS);
  }

  async flushSave(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
      if (this.habitCache) {
        await this.storage.save(CONSTANTS.STORAGE.HABITS_KEY, this.habitCache);
        if (this.isNativeIOS) {
          await WidgetsBridgePlugin.reloadAllTimelines();
        }
      }
    }
  }

  async load(): Promise<Habit.Data> {
    return this.handleStorageOperation(
      async () => {
        if (this.habitCache) return this.habitCache;
        const data = await this.storage.load(CONSTANTS.STORAGE.HABITS_KEY);
        const resolvedData: Habit.Data = data || { habits: [] };
        this.habitCache = resolvedData;
        return resolvedData;
      },
      'Failed to load habit data'
    );
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        this.settingsCache = settings;
        await this.storage.save(CONSTANTS.STORAGE.SETTINGS_KEY, settings);
      },
      'Failed to save settings'
    );
  }

  async loadSettings(): Promise<AppSettings> {
    return this.handleStorageOperation(
      async () => {
        if (this.settingsCache) return this.settingsCache;
        const settings = await this.storage.load(CONSTANTS.STORAGE.SETTINGS_KEY);
        const resolvedSettings: AppSettings = settings || {};
        this.settingsCache = resolvedSettings;
        return resolvedSettings;
      },
      'Failed to load settings'
    );
  }

  async refresh(): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        this.habitCache = null; // Clear cache to force reload
        await this.load();
      },
      'Failed to refresh storage'
    );
  }

  async clear(): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        if (this.saveDebounceTimer) {
          clearTimeout(this.saveDebounceTimer);
          this.saveDebounceTimer = null;
        }
        this.habitCache = null;
        await this.storage.clear(CONSTANTS.STORAGE.HABITS_KEY);
        if (this.isNativeIOS) {
          await WidgetsBridgePlugin.reloadAllTimelines();
        }
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
    settings?: AppSettings,
  ): Promise<AppSettings> {
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
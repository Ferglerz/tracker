import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { Capacitor } from '@capacitor/core';
import { Habit, StorageStrategy, AppSettings } from '@utils/TypesAndProps';
import { IonicStorageStrategy } from '@utils/IonicStorageStrategy';
import { NativeStorageStrategy } from '@utils/NativeStorageStrategy';
import { CONSTANTS } from '@utils/Constants';

const HABIT_SCHEMA_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function migrateHabitData(value: unknown): Habit.Data {
  if (value === null || value === undefined) {
    return { habits: [], schemaVersion: HABIT_SCHEMA_VERSION };
  }
  if (!isRecord(value) || !Array.isArray(value.habits)) {
    throw new Error('Stored habit data has an invalid shape');
  }
  if (
    value.schemaVersion !== undefined &&
    typeof value.schemaVersion !== 'number'
  ) {
    throw new Error('Stored habit data schema version is invalid');
  }
  if (
    typeof value.schemaVersion === 'number' &&
    value.schemaVersion > HABIT_SCHEMA_VERSION
  ) {
    throw new Error(`Unsupported habit data schema version: ${value.schemaVersion}`);
  }

  const habits = value.habits.map((rawHabit, index) => {
    if (!isRecord(rawHabit)) {
      throw new Error(`Stored habit at index ${index} is invalid`);
    }
    if (
      typeof rawHabit.id !== 'string' ||
      typeof rawHabit.name !== 'string' ||
      (rawHabit.type !== 'checkbox' && rawHabit.type !== 'quantity')
    ) {
      throw new Error(`Stored habit at index ${index} is missing required fields`);
    }
    if (rawHabit.history !== undefined && !isRecord(rawHabit.history)) {
      throw new Error(`Stored history at index ${index} is invalid`);
    }
    if (rawHabit.goal !== undefined && typeof rawHabit.goal !== 'number') {
      throw new Error(`Stored goal at index ${index} is invalid`);
    }
    if (rawHabit.quantity !== undefined && typeof rawHabit.quantity !== 'number') {
      throw new Error(`Stored quantity at index ${index} is invalid`);
    }
    if (
      rawHabit.frequency !== undefined &&
      rawHabit.frequency !== 'daily' &&
      rawHabit.frequency !== 'weekly' &&
      rawHabit.frequency !== 'monthly'
    ) {
      throw new Error(`Stored frequency at index ${index} is invalid`);
    }

    return {
      ...rawHabit,
      goal: typeof rawHabit.goal === 'number' ? rawHabit.goal : 1,
      quantity: typeof rawHabit.quantity === 'number' ? rawHabit.quantity : 0,
      bgColor: typeof rawHabit.bgColor === 'string'
        ? rawHabit.bgColor
        : 'var(--ion-color-primary)',
      history: rawHabit.history ?? {},
      frequency:
        rawHabit.frequency === 'weekly' || rawHabit.frequency === 'monthly'
          ? rawHabit.frequency
          : 'daily',
    } as Habit.Habit;
  });

  return { ...value, habits, schemaVersion: HABIT_SCHEMA_VERSION };
}

export class HabitStorage {
  private static instance: HabitStorage;
  private storage: StorageStrategy;
  private initPromise: Promise<void>;
  private isNativeIOS: boolean;

  private habitCache: Habit.Data | null = null;
  private settingsCache: AppSettings | null = null;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private saveWaiters: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];
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
        const migratedData = migrateHabitData(data);
        this.habitCache = migratedData;
        await this.debouncedSave();
      },
      'Failed to save habit data'
    );
  }

  private debouncedSave(): Promise<void> {
    if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
    const completion = new Promise<void>((resolve, reject) => {
      this.saveWaiters.push({ resolve, reject });
    });
    this.saveDebounceTimer = setTimeout(async () => {
      this.saveDebounceTimer = null;
      try {
        if (!this.habitCache) throw new Error('Habit cache was cleared before save');
        await this.persistHabitCache();
        this.settleSaveWaiters();
      } catch (error) {
        const storageError = error instanceof Error ? error : new Error('Debounced save failed');
        this.settleSaveWaiters(storageError);
      }
    }, this.DEBOUNCE_MS);
    return completion;
  }

  private async persistHabitCache(): Promise<void> {
    if (!this.habitCache) return;
    await this.storage.save(CONSTANTS.STORAGE.HABITS_KEY, this.habitCache);
    if (this.isNativeIOS) {
      await WidgetsBridgePlugin.reloadAllTimelines();
    }
  }

  private settleSaveWaiters(error?: Error): void {
    const waiters = this.saveWaiters.splice(0);
    waiters.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve();
    });
  }

  private cancelDebouncedSave(reason: string): void {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    if (this.saveWaiters.length) {
      this.settleSaveWaiters(new Error(reason));
    }
  }

  async flushSave(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
      try {
        await this.persistHabitCache();
        this.settleSaveWaiters();
      } catch (error) {
        const storageError = error instanceof Error ? error : new Error('Failed to flush save');
        this.settleSaveWaiters(storageError);
        throw storageError;
      }
    }
  }

  async load(): Promise<Habit.Data> {
    return this.handleStorageOperation(
      async () => {
        if (this.habitCache) return this.habitCache;
        const data = await this.storage.load(CONSTANTS.STORAGE.HABITS_KEY);
        const resolvedData = migrateHabitData(data);
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
        if (settings !== null && !isRecord(settings)) {
          throw new Error('Stored settings have an invalid shape');
        }
        const resolvedSettings: AppSettings = settings ?? {};
        this.settingsCache = resolvedSettings;
        return resolvedSettings;
      },
      'Failed to load settings'
    );
  }

  async refresh(): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        // Foreground refresh treats shared native storage as authoritative.
        // Never flush stale in-memory state over changes made by a widget.
        this.cancelDebouncedSave('Pending save superseded by storage refresh');
        this.habitCache = null;
        const data = await this.storage.load(CONSTANTS.STORAGE.HABITS_KEY);
        this.habitCache = migrateHabitData(data);
      },
      'Failed to refresh storage'
    );
  }

  async clear(): Promise<void> {
    return this.handleStorageOperation(
      async () => {
        this.cancelDebouncedSave('Pending save cancelled because storage was cleared');
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
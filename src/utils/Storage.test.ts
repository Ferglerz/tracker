import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' },
}));
vi.mock('capacitor-widgetsbridge-plugin', () => ({
  WidgetsBridgePlugin: { reloadAllTimelines: vi.fn() },
}));

import { HabitStorage, migrateHabitData } from './Storage';
import type { Habit, StorageStrategy } from './TypesAndProps';

const habit = (name: string): Habit.Habit => ({
  id: name,
  name,
  type: 'checkbox',
  goal: 1,
  bgColor: '#fff',
  quantity: 0,
  history: {},
});

function makeStorage(strategy: StorageStrategy): HabitStorage {
  const storage = Object.create(HabitStorage.prototype) as HabitStorage;
  Object.assign(storage, {
    storage: strategy,
    initPromise: Promise.resolve(),
    isNativeIOS: false,
    habitCache: null,
    settingsCache: null,
    saveDebounceTimer: null,
    saveWaiters: [],
    DEBOUNCE_MS: 300,
  });
  return storage;
}

describe('HabitStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('migrates legacy data without dropping unknown fields', () => {
    const migrated = migrateHabitData({
      habits: [{ id: 'a', name: 'A', type: 'checkbox', legacy: 'kept' }],
      legacyRoot: true,
    });

    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.habits[0]).toMatchObject({
      id: 'a',
      history: {},
      quantity: 0,
      frequency: 'daily',
      legacy: 'kept',
    });
    expect((migrated as unknown as Record<string, unknown>).legacyRoot).toBe(true);
  });

  it('rejects unsupported future schemas', () => {
    expect(() => migrateHabitData({ habits: [], schemaVersion: 2 }))
      .toThrow('Unsupported habit data schema version');
  });

  it('discards pending stale cache during foreground refresh', async () => {
    const strategy: StorageStrategy = {
      save: vi.fn().mockResolvedValue(undefined),
      load: vi.fn().mockResolvedValue({ habits: [habit('widget')] }),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const storage = makeStorage(strategy);
    const pendingSave = storage.save({ habits: [habit('stale')] });
    const rejectedSave = expect(pendingSave).rejects.toThrow('superseded by storage refresh');
    await Promise.resolve();
    await storage.refresh();

    await rejectedSave;
    expect(strategy.save).not.toHaveBeenCalled();
    expect((await storage.load()).habits[0].name).toBe('widget');
  });

  it('surfaces debounced persistence failures and clears timer', async () => {
    const strategy: StorageStrategy = {
      save: vi.fn().mockRejectedValue(new Error('disk full')),
      load: vi.fn().mockResolvedValue(null),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const storage = makeStorage(strategy);
    const saving = storage.save({ habits: [habit('a')] });
    const rejectedSave = expect(saving).rejects.toThrow('Failed to save habit data: disk full');
    await Promise.resolve();
    await vi.runAllTimersAsync();

    await rejectedSave;
    expect((storage as unknown as { saveDebounceTimer: unknown }).saveDebounceTimer).toBeNull();
  });
});

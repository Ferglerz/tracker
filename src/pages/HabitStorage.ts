import { Preferences } from '@capacitor/preferences';
import { Storage } from '@ionic/storage';
import { Capacitor } from '@capacitor/core';


// TESTING iOS isn't using ionic:
const bypassIonicStorage = false;

const platform = Capacitor.getPlatform();
const isNativeStorage = platform === 'ios' || platform === 'android';

// Configure Preferences to use app group on iOS
if (platform === 'ios') {
  Preferences.configure({
    group: 'group.io.ionic.tracker'
  });
}

const currentStorageMethod = isNativeStorage ? 'Preferences' : 'Ionic Storage';
export const getCurrentStorage = () => currentStorageMethod;


export const storageService = {
  async get(key: string): Promise<string | null> {
    try {
      if (isNativeStorage) {
        const { value } = await Preferences.get({ key });
        return value;
      } else {
        if (!storageInstance) return null;
        const value = await storageInstance.get(key);
        return typeof value === 'object' ? JSON.stringify(value) : value;
      }
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },
  
  async set(key: string, value: string): Promise<void> {
    try {
      if (isNativeStorage) {
        await Preferences.set({ key, value });
      } else {
        if (!storageInstance) return;
        const parsedValue = JSON.parse(value);
        await storageInstance.set(key, parsedValue);
      }
    } catch (e) {
      console.error('Storage set error:', e);
    }
  }
};


export interface Habit {
  id: string;
  name: string;
  type: 'checkbox' | 'quantity';
  unit?: string;
  quantity: number;
  goal?: number;
  isChecked: boolean;
  isComplete: boolean;
  isBegun: boolean;
  bgColor?: string;
}

export interface HabitHistory {
  [habitId: string]: {
    [date: string]: number | boolean;
  };
}

const STORAGE_KEYS = {
  HABITS: 'habits',
  HISTORY: 'habitHistory'
};

let storageInstance: Storage | null = null;

if (!isNativeStorage) {
  const initializeStorage = async () => {
    if (!storageInstance) {
      storageInstance = new Storage();
      await storageInstance.create();
    }
    return storageInstance;
  };
  
  // Initialize storage immediately
  initializeStorage();
}

export const loadHabits = async (): Promise<Habit[]> => {
  const value = await storageService.get(STORAGE_KEYS.HABITS);
  try {
    return value ? JSON.parse(value) : [];
  } catch (e) {
    console.error('Parse error:', e);
    return [];
  }
};

export const loadHistory = async (): Promise<HabitHistory> => {
  const value = await storageService.get(STORAGE_KEYS.HISTORY);
  return value ? JSON.parse(value) : {};
};

export const saveHabits = async (habits: Habit[]): Promise<void> => {
  await storageService.set(STORAGE_KEYS.HABITS, JSON.stringify(habits));
};

export const saveHistory = async (history: HabitHistory): Promise<void> => {
  await storageService.set(STORAGE_KEYS.HISTORY, JSON.stringify(history));
};

export const getStatusColor = (status: 'complete' | 'partial' | 'none'): string => {
  switch (status) {
    case 'complete':
      return '#2dd36f';
    case 'partial':
      return '#ffc409';
    case 'none':
      return 'transparent';
  }
};
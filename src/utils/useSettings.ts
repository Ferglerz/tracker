import { useState, useEffect, useCallback } from 'react';
import { handleSettings } from '@utils/Storage';
import type { AppSettings } from '@utils/TypesAndProps';
import { BehaviorSubject } from 'rxjs';

const DEFAULT_SETTINGS: AppSettings = {
  historyGrid: true,
};

const settingsSubject = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS);

// Load initial settings immediately
handleSettings('load').then(loaded => {
  settingsSubject.next({ ...DEFAULT_SETTINGS, ...loaded });
}).catch(error => {
  console.error('Failed to load settings in subject:', error);
});

interface UseSettingsResult {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  isLoaded: boolean;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(settingsSubject.value);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const sub = settingsSubject.subscribe(val => {
      setSettings(val);
      setIsLoaded(true);
    });
    return () => sub.unsubscribe();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...settingsSubject.value, ...updates };
      await handleSettings('save', newSettings);
      settingsSubject.next(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, []);

  return { settings, updateSettings, isLoaded };
}

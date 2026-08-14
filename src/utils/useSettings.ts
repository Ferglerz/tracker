import { useState, useEffect, useCallback } from 'react';
import { handleSettings } from '@utils/Storage';
import type { AppSettings } from '@utils/TypesAndProps';
import { BehaviorSubject } from 'rxjs';
import {
  NotificationService,
  type NotificationSyncStatus,
} from '@utils/NotificationService';

const DEFAULT_SETTINGS: AppSettings = {
  historyGrid: true,
};

const settingsSubject = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS);

const settingsInitialization = handleSettings('load').then(async loaded => {
  settingsSubject.next({ ...DEFAULT_SETTINGS, ...loaded });
  await NotificationService.initialize();
});

interface UseSettingsResult {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => Promise<NotificationSyncStatus>;
  isLoaded: boolean;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(settingsSubject.value);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const sub = settingsSubject.subscribe(val => {
      setSettings(val);
    });
    let active = true;
    settingsInitialization
      .then(() => {
        if (active) setIsLoaded(true);
      })
      .catch(error => {
        console.error('Failed to initialize settings:', error);
        if (active) setIsLoaded(true);
      });
    return () => {
      active = false;
      sub.unsubscribe();
    };
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...settingsSubject.value, ...updates };
      await handleSettings('save', newSettings);
      settingsSubject.next(newSettings);
      return await NotificationService.syncFromSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }, []);

  return { settings, updateSettings, isLoaded };
}

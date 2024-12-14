import { WidgetsBridgePlugin, type TimelinesOptions } from 'capacitor-widgetsbridge-plugin';

// Plugin specific types
interface WidgetConfiguration {
  widgetId: string;
  kind: string;
}

interface UserDefaultsOptions {
  key: string;
  value: string;
  group: string;
}

// Habit interfaces
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

export interface HabitData {
  habits: Habit[];
  history: HabitHistory;
}

// Export everything from a single source
export const HabitStorageAPI = {
  handleHabitData: async (
    action: 'load' | 'save',
    data?: HabitData
  ): Promise<HabitData | void> => {
    const defaultData: HabitData = { habits: [], history: {} };

    switch (action) {
      case 'load':
        try {
          const result = await WidgetsBridgePlugin.getItem({
            key: 'habitData',
            group: 'group.io.ionic.tracker'
          });

          if (!result || !(result as any).value) return defaultData;
          return JSON.parse((result as any).value);
        } catch (e) {
          console.error('Load error:', e);
          return defaultData;
        }
      case 'save':
        if (!data) return;
        try {
          await syncWithWidgets(data);
        } catch (e) {
          console.error('Save error:', e);
        }
        break;
    }
  },

  refreshWidgets: async (): Promise<void> => {
    try {
      const data = await HabitStorageAPI.handleHabitData('load') as HabitData;
      if (data) {
        await syncWithWidgets(data);
      }
    } catch (e) {
      console.error('Widget refresh error:', e);
    }
  },

  removeWidgetData: async (widgetId: string): Promise<void> => {
    try {
      await WidgetsBridgePlugin.removeItem({
        key: 'habitData',
        group: 'group.io.ionic.tracker'
      });
      
      // For now, just reload all timelines since we're unsure of the exact TimelinesOptions type
      await WidgetsBridgePlugin.reloadAllTimelines();
    } catch (e) {
      console.error('Remove widget data error:', e);
    }
  },

  getStatusColor: (status: 'complete' | 'partial' | 'none'): string => {
    switch (status) {
      case 'complete':
        return '#2dd36f';
      case 'partial':
        return '#ffc409';
      case 'none':
        return 'transparent';
    }
  }
};

// Private helper function
async function syncWithWidgets(data: HabitData) {
  try {
    await WidgetsBridgePlugin.setItem({
      key: 'habitData',
      value: JSON.stringify(data),
      group: 'group.io.ionic.tracker'
    } as UserDefaultsOptions);

    await WidgetsBridgePlugin.reloadAllTimelines();
  } catch (e) {
    console.error('Widget sync error:', e);
  }
}

// Re-export individual functions for backward compatibility
export const { handleHabitData, refreshWidgets, removeWidgetData, getStatusColor } = HabitStorageAPI;
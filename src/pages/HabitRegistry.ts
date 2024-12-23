// HabitRegistry.ts
import { HabitEntity } from './HabitEntity';
import { Habit } from './HabitTypes';
import { HabitStorageAPI } from './HabitStorage';
import { errorHandler } from './ErrorUtils';
import { Capacitor } from '@capacitor/core';
import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';

export class HabitRegistry {
  private static instances: Map<string, HabitEntity> = new Map();

  static async create(props: Habit.Base): Promise<HabitEntity> {
    let instance = HabitRegistry.instances.get(props.id);
    const data = await HabitStorageAPI.handleHabitData('load');
    
    if (instance) {
      // Update existing instance
      const existingHabit = data.habits.find(h => h.id === props.id);
      if (existingHabit) {
        instance.updateProperties({
          name: props.name,
          unit: props.unit,
          goal: props.goal,
          bgColor: props.bgColor,
        });
      }
    } else {
      // Create new instance
      const history = data.history[props.id] || {};
      instance = new HabitEntity(props, history);
      HabitRegistry.instances.set(props.id, instance);
      
      if (!data.habits.find(h => h.id === props.id)) {
        data.habits.push(instance.toJSON());
        await HabitStorageAPI.handleHabitData('save', data);
      }
    }
    
    return instance;
  }

// HabitRegistry.ts
static async update(habit: Habit.Model): Promise<void> {
  try {
    const data = await HabitStorageAPI.handleHabitData('load');
    const habitIndex = data.habits.findIndex(h => h.id === habit.id);
    
    if (habitIndex !== -1) {
      // Update storage with full habit data
      data.habits[habitIndex] = {
        ...data.habits[habitIndex],
        ...habit,
      };
      
      await HabitStorageAPI.handleHabitData('save', data);
      
      // Update instance if it exists, but skip storage update to prevent loops
      const instance = HabitRegistry.instances.get(habit.id);
      if (instance) {
        instance.updateProperties(habit);
        await instance.updateState({
          quantity: habit.quantity,
          isChecked: habit.isChecked,
          isComplete: habit.isComplete,
          isBegun: habit.isBegun
        }, new Date(), true); // Skip storage update
      }
      
      // Force widget refresh
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
        await WidgetsBridgePlugin.reloadAllTimelines();
      }
    }
  } catch (error) {
    errorHandler.handleError(error, 'Failed to update habit');
    throw error;
  }
}

  static async getAll(): Promise<HabitEntity[]> {
    const data = await HabitStorageAPI.handleHabitData('load');
    return Promise.all(data.habits.map(habit => HabitRegistry.create(habit)));
  }

  static async delete(id: string): Promise<void> {
    try {
      const data = await HabitStorageAPI.handleHabitData('load');
      const { [id]: deletedHistory, ...remainingHistory } = data.history;
      const updatedHabits = data.habits.filter(h => h.id !== id);
      
      await HabitStorageAPI.handleHabitData('save', {
        habits: updatedHabits,
        history: remainingHistory
      });

      HabitRegistry.instances.delete(id);
      await HabitStorageAPI.refreshWidgets();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
      throw error;
    }
  }

  static async syncWithStorage(): Promise<void> {
    try {
      const data = await HabitStorageAPI.handleHabitData('load');
      for (const [id, instance] of HabitRegistry.instances) {
        const storedHabit = data.habits.find(h => h.id === id);
        const storedHistory = data.history[id] || {};
        
        if (storedHabit) {
          instance.updateProperties(storedHabit);
          instance.setHistory(storedHistory);
        }
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to sync with storage');
    }
  }
}
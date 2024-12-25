// HabitRegistry.ts
import { HabitEntity } from './HabitEntity';
import { Habit } from './HabitTypes';
import { HabitStorage, HabitStorageAPI } from './HabitStorage';
import { errorHandler } from './ErrorUtils';
import { Capacitor } from '@capacitor/core';
import { WidgetsBridgePlugin } from 'capacitor-widgetsbridge-plugin';
import { formatDateKey } from './HabitUtils';

export class HabitRegistry {
  private static instances: Map<string, HabitEntity> = new Map();
  private static initialized: boolean = false;

  // HabitRegistry.ts - modify initialize method
private static async initialize() {
  if (this.initialized) return;
  
  try {
      console.log('Initializing HabitRegistry...');
      const data = await HabitStorageAPI.handleHabitData('load');
      console.log('Loaded habit data:', data);

      // Clear existing instances
      this.instances.clear();
      
      // Pre-populate instances map
      for (const habitData of data.habits) {
          try {
              // Create initial state from the habit data
              const initialState: Habit.State = {
                  quantity: habitData.quantity ?? 0,
                  isChecked: habitData.isChecked ?? false,
                  isComplete: habitData.isComplete ?? false,
                  isBegun: habitData.isBegun ?? false
              };
              
              // Create instance with state
              const instance = new HabitEntity(habitData, initialState);
              // Use public setHistory method instead of _setHistory
              instance.setHistory(data.history[habitData.id] || {});
              this.instances.set(habitData.id, instance);
              
              console.log(`Initialized habit: ${habitData.id}`, {
                  habitData,
                  initialState,
                  history: data.history[habitData.id] || {}
              });
          } catch (error) {
              console.error('Failed to initialize habit:', habitData, error);
          }
      }
      
      this.initialized = true;
      console.log('HabitRegistry initialization complete');
  } catch (error) {
      console.error('Failed to initialize HabitRegistry:', error);
      this.initialized = false;
      throw error;
  }
}

  static async getAll(): Promise<HabitEntity[]> {
    await this.initialize();
    const data = await HabitStorageAPI.handleHabitData('load');
    return Promise.all(data.habits.map(habit => this.create(habit)));
  }

 // HabitRegistry.ts
static async create(props: Habit.Base): Promise<HabitEntity> {
  await this.initialize();
  
  const data = await HabitStorageAPI.handleHabitData('load');
  let instance = this.instances.get(props.id);

  if (instance) {
    const existingHabit = data.habits.find(h => h.id === props.id);
    if (existingHabit) {
      instance._updateProps({
        name: props.name,
        unit: props.unit,
        goal: props.goal,
        bgColor: props.bgColor,
      });
      return instance;
    }
  }

  // Create new instance with proper ID generation
  const newId = props.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const newProps = { ...props, id: newId };
  
  instance = new HabitEntity(newProps);
  this.instances.set(newId, instance);
  
  if (!data.habits.find(h => h.id === newId)) {
    data.habits.push(instance.toJSON());
    await HabitStorageAPI.handleHabitData('save', data);
    
    // Force sync after creating new habit
    await this.syncWithStorage();
  }

  return instance;
}

  static async update(habitId: string, updates: Partial<Habit.Model>): Promise<void> {
    const instance = this.instances.get(habitId);
    if (!instance) {
      throw new Error('Habit not found');
    }

    const data = await HabitStorageAPI.handleHabitData('load');
    const habitIndex = data.habits.findIndex(h => h.id === habitId);
    
    if (habitIndex !== -1) {
      data.habits[habitIndex] = {
        ...data.habits[habitIndex],
        ...updates
      };
      
      await HabitStorageAPI.handleHabitData('save', data);
      
      // Update instance
      if ('name' in updates || 'unit' in updates || 'goal' in updates || 'bgColor' in updates) {
        instance._updateProps(updates);
      }
      
      if ('quantity' in updates || 'isChecked' in updates || 'isComplete' in updates || 'isBegun' in updates) {
        instance._updateState(updates);
      }
    }
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

      this.instances.delete(id);
      await HabitStorageAPI.refreshWidgets();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
      throw error;
    }
  }

  static async updateState(
    habitId: string,
    updates: Partial<Habit.State>,
    date: Date = new Date()
  ): Promise<void> {
    try {
      const instance = this.instances.get(habitId);
      if (!instance) {
        throw new Error('Habit not found');
      }

      // Calculate complete new state
      const newState: Habit.State = {
        quantity: updates.quantity ?? instance.quantity,
        isChecked: updates.isChecked ?? instance.isChecked,
        isComplete: updates.isComplete ?? instance.isComplete,
        isBegun: updates.isBegun ?? instance.isBegun
      };

      // Update storage first
      const data = await HabitStorageAPI.handleHabitData('load');
      const habitIndex = data.habits.findIndex(h => h.id === habitId);
      
      if (habitIndex !== -1) {
        data.habits[habitIndex] = {
          ...data.habits[habitIndex],
          ...newState
        };

        // Update history in storage
        const dateKey = formatDateKey(date);
        if (dateKey) {
          if (!data.history[habitId]) {
            data.history[habitId] = {};
          }
          data.history[habitId][dateKey] = instance.type === 'checkbox' ? 
            newState.isChecked : newState.quantity;
        }

        await HabitStorageAPI.handleHabitData('save', data);
        
        // Then update instance
        instance._updateState(newState, date);

        // Refresh widgets if on iOS
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
          await WidgetsBridgePlugin.reloadAllTimelines();
        }
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update habit state');
      throw error;
    }
  }

  static async increment(habitId: string, amount: number = 1): Promise<void> {
    const instance = this.instances.get(habitId);
    if (!instance || instance.type !== 'quantity') {
      throw new Error('Invalid habit for increment operation');
    }

    const newQuantity = Math.max(0, instance.quantity + amount);
    const newState: Partial<Habit.State> = {
      quantity: newQuantity,
      isBegun: newQuantity > 0,
      isComplete: instance.goal ? newQuantity >= instance.goal : false
    };

    await this.updateState(habitId, newState);
  }

  static async setChecked(habitId: string, checked: boolean, date: Date = new Date()): Promise<void> {
    const instance = this.instances.get(habitId);
    if (!instance || instance.type !== 'checkbox') {
      throw new Error('Invalid habit for checkbox operation');
    }

    await this.updateState(habitId, {
      isChecked: checked,
      isComplete: checked,
      isBegun: checked
    }, date);
  }

  static async setValue(habitId: string, value: number, date: Date = new Date()): Promise<void> {
    const instance = this.instances.get(habitId);
    if (!instance || instance.type !== 'quantity') {
      throw new Error('Invalid habit for value operation');
    }

    const newValue = Math.max(0, value);
    await this.updateState(habitId, {
      quantity: newValue,
      isBegun: newValue > 0,
      isComplete: instance.goal ? newValue >= instance.goal : false
    }, date);
  }

  static async syncWithStorage(): Promise<void> {
    try {
      // Reset initialization flag to force reload
      this.initialized = false;
      await this.initialize();
  
      const data = await HabitStorageAPI.handleHabitData('load');
      const storage = HabitStorage.getInstance();
  
      // Update instances
      for (const [id, instance] of this.instances) {
        const storedHabit = data.habits.find(h => h.id === id);
        if (storedHabit) {
          instance._updateProps(storedHabit);
          instance._updateState({
            quantity: storedHabit.quantity,
            isChecked: storedHabit.isChecked,
            isComplete: storedHabit.isComplete,
            isBegun: storedHabit.isBegun
          });
          instance.setHistory(data.history[id] || {});
        }
      }
  
      // Notify observers of the update
      await storage.notifyObservers(data);
    } catch (error) {
      errorHandler.handleError(error, 'Failed to sync with storage');
      throw error;
    }
  }
}
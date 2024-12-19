// HabitModel.ts
import { Subject, Observable } from 'rxjs';
import { errorHandler } from './ErrorUtils';
import { HabitStorageAPI, type Habit} from './HabitStorage';
import { formatDateKey, getHabitStatus } from './HabitUtils';

export interface HabitProperties {
  id: string;
  name: string;
  type: 'checkbox' | 'quantity';
  unit?: string;
  goal?: number;
  bgColor: string;
}

export class HabitModel {
  private static instances: Map<string, HabitModel> = new Map();
  private changeSubject = new Subject<void>();
  
  private _quantity: number = 0;
  private _isChecked: boolean = false;
  private _isComplete: boolean = false;
  private _isBegun: boolean = false;

  private constructor(
    private props: HabitProperties,
    private history: Record<string, number | boolean> = {}
  ) {}

  // Factory method to ensure single instance per habit ID and persist to storage
  static async create(props: HabitProperties): Promise<HabitModel> {
    let instance = HabitModel.instances.get(props.id);
    const data = await HabitStorageAPI.handleHabitData('load');
    
    if (instance) {
      // Update all properties including state from storage
      const existingHabit = data.habits.find(h => h.id === props.id);
      if (existingHabit) {
        instance.props = {
          ...instance.props,
          name: props.name,
          unit: props.unit,
          goal: props.goal,
          bgColor: props.bgColor,
        };
        // Update state values from storage and notify if changed
        if (instance._quantity !== existingHabit.quantity ||
            instance._isChecked !== existingHabit.isChecked ||
            instance._isComplete !== existingHabit.isComplete ||
            instance._isBegun !== existingHabit.isBegun) {
          instance._quantity = existingHabit.quantity;
          instance._isChecked = existingHabit.isChecked;
          instance._isComplete = existingHabit.isComplete;
          instance._isBegun = existingHabit.isBegun;
          // Notify observers of state change
          instance.changeSubject.next();
        }
      }
    } else {
      // Create new instance with history
      const history = data.history[props.id] || {};
      instance = new HabitModel(props, history);
      HabitModel.instances.set(props.id, instance);
      
      // Only save to storage for new instances
      if (!data.habits.find(h => h.id === props.id)) {
        data.habits.push(instance.toJSON());
        await HabitStorageAPI.handleHabitData('save', data);
      }
    }
    
    return instance;
  }

  // Getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get type(): 'checkbox' | 'quantity' { return this.props.type; }
  get unit(): string | undefined { return this.props.unit; }
  get goal(): number | undefined { return this.props.goal; }
  get bgColor(): string { return this.props.bgColor; }
  get quantity(): number { return this._quantity; }
  get isChecked(): boolean { return this._isChecked; }
  get isComplete(): boolean { return this._isComplete; }
  get isBegun(): boolean { return this._isBegun; }

  // Observable for changes
  get changes(): Observable<void> {
    return this.changeSubject.asObservable();
  }

  // Get all history data
  async getAllHistory(): Promise<Record<string, number | boolean>> {
    try {
      const data = await HabitStorageAPI.handleHabitData('load');
      this.history = data.history[this.id] || {};
      return { ...this.history };
    } catch (error) {
      errorHandler.handleError(error, 'Failed to load habit history');
      return this.history;
    }
  }

  // State management methods with storage updates
  private async updateState(
    updates: Partial<{
      quantity: number;
      isChecked: boolean;
      isComplete: boolean;
      isBegun: boolean;
    }>,
    date: Date = new Date()
  ): Promise<void> {
    // Update local state properties properly
    if (updates.quantity !== undefined) this._quantity = updates.quantity;
    if (updates.isChecked !== undefined) this._isChecked = updates.isChecked;
    if (updates.isComplete !== undefined) this._isComplete = updates.isComplete;
    if (updates.isBegun !== undefined) this._isBegun = updates.isBegun;
  
    const dateKey = formatDateKey(date);
    const value = this.type === 'checkbox' ? this._isChecked : this._quantity;
  
    try {
      const data = await HabitStorageAPI.handleHabitData('load');
      
      // Update habit properties in storage
      const habitIndex = data.habits.findIndex(h => h.id === this.id);
      if (habitIndex !== -1) {
        data.habits[habitIndex] = this.toJSON();
      }
  
      // Update history
      if (!data.history[this.id]) {
        data.history[this.id] = {};
      }
      data.history[this.id][dateKey] = value;
      
      await HabitStorageAPI.handleHabitData('save', data);
      
      this.history[dateKey] = value;
      this.changeSubject.next();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to update habit state');
      throw error;
    }
  }

  // Public methods for habit interactions
  async increment(amount: number = 1): Promise<void> {
    if (this.type !== 'quantity') return;

    const newQuantity = Math.max(0, this._quantity + amount);
    await this.updateState({
      quantity: newQuantity,
      isBegun: newQuantity > 0,
      isComplete: this.goal ? newQuantity >= this.goal : false
    });
  }

  async setChecked(checked: boolean, date: Date = new Date()): Promise<void> {
    if (this.type !== 'checkbox') return;

    await this.updateState({
      isChecked: checked,
      isComplete: checked,
      isBegun: checked
    }, date);
  }

  async setValue(value: number, date: Date = new Date()): Promise<void> {
    if (this.type !== 'quantity') return;

    await this.updateState({
      quantity: Math.max(0, value),
      isBegun: value > 0,
      isComplete: this.goal ? value >= this.goal : false
    }, date);
  }

  // History methods
  getValueForDate(date: Date): number | boolean | undefined {
    try {
      const dateKey = formatDateKey(date);
      if (!dateKey) return undefined;
      return this.history[dateKey];
    } catch {
      return undefined;
    }
  }

  getStatusForDate(date: Date): 'complete' | 'partial' | 'none' {
    const value = this.getValueForDate(date);
    return getHabitStatus(value, this);
  }

  // Serialization
  toJSON() {
    return {
      ...this.props,
      quantity: this._quantity,
      isChecked: this._isChecked,
      isComplete: this._isComplete,
      isBegun: this._isBegun
    };
  }

  // Static methods for bulk operations
  static async getAll(): Promise<HabitModel[]> {
    const data = await HabitStorageAPI.handleHabitData('load');
    return Promise.all(data.habits.map(habit => HabitModel.create(habit)));
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

      HabitModel.instances.delete(id);
      
      // Clear local storage cache
      await HabitStorageAPI.refreshWidgets();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
      throw error;
    }
  }
}
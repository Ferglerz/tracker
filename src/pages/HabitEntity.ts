// HabitEntity.ts
import { Subject, Observable } from 'rxjs';
import { formatDateKey, getHabitStatus } from './HabitUtils';
import { Habit } from './HabitTypes';
import { HabitStorageAPI } from './HabitStorage';
import { errorHandler } from './ErrorUtils'

export class HabitEntity {
  private changeSubject = new Subject<void>();
  constructor(private props: Habit.Habit) { }

  // Read-only getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get type(): Habit.Type { return this.props.type; }
  get unit(): string | undefined { return this.props.unit; }
  get goal(): number | undefined { return this.props.goal; }
  get bgColor(): string { return this.props.bgColor; }
  get quantity(): number { return this.props.quantity; }
  get isChecked(): boolean { return this.props.isChecked; }
  get isComplete(): boolean { return this.props.isComplete; }
  get isBegun(): boolean { return this.props.isBegun; }
  get history(): Record<string, [number, number] | boolean> { return this.props.history; }

  get changes(): Observable<void> {
    return this.changeSubject.asObservable();
  }

  private async update(updates: Partial<Habit.Habit>, date: Date = new Date()): Promise<void> {
    const data = await HabitStorageAPI.handleHabitData('load');
    const habitIndex = data.habits.findIndex(h => h.id === this.id);

    if (habitIndex === -1) {
      throw new Error('Habit not found in storage');
    }

    // Update the habit directly within the habits array
    const updatedHabit = { ...data.habits[habitIndex], ...updates };
    data.habits[habitIndex] = updatedHabit;

    if ('quantity' in updates || 'isChecked' in updates) {
      const dateKey = formatDateKey(date);
      updatedHabit.history = updatedHabit.history || {}; // Ensure history exists
      if (this.type === 'quantity' && typeof updates.quantity === 'number') {
        updatedHabit.history[dateKey] = [updates.quantity, updatedHabit.goal || 0];
      } else if (this.type === 'checkbox' && typeof updates.isChecked === 'boolean') {
        updatedHabit.history[dateKey] = updates.isChecked;
      }
    }

    await HabitStorageAPI.handleHabitData('save', data);
    this.props = updatedHabit; // Update the local habitData
    this.changeSubject.next();
  }

  async increment(amount: number = 1): Promise<void> {
    if (this.type !== 'quantity') {
      throw new Error('Invalid habit for increment operation');
    }
    const newQuantity = Math.max(0, this.quantity + amount);
    await this.update({
      quantity: newQuantity,
      isBegun: newQuantity > 0,
      isComplete: this.goal ? newQuantity >= this.goal : false
    });
  }

  async setChecked(checked: boolean, date: Date = new Date()): Promise<void> {
    if (this.type !== 'checkbox') {
      throw new Error('Invalid habit for checkbox operation');
    }
    await this.update({
      isChecked: checked,
      isComplete: checked,
      isBegun: checked
    });
  }

  async setValue(value: number, date: Date = new Date()): Promise<void> {
    if (this.type !== 'quantity') {
      throw new Error('Invalid habit for value operation');
    }
    const newValue = Math.max(0, value);
    await this.update({
      quantity: newValue,
      isBegun: newValue > 0,
      isComplete: this.goal ? newValue >= this.goal : false
    });
  }

  static async loadAll(): Promise<HabitEntity[]> {
    const data = await HabitStorageAPI.handleHabitData('load');
    return data.habits.map(habitData => new HabitEntity(habitData));
  }

  static async create(props: Habit.Habit): Promise<HabitEntity> {
    const data = await HabitStorageAPI.handleHabitData('load');
    const newId = props.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newProps = { ...props, id: newId };
    const newHabitData: Habit.Habit = {
      ...newProps,
      quantity: 0,
      isChecked: false,
      isComplete: false,
      isBegun: false,
      history: {}
    };
    data.habits.push(newHabitData);
    await HabitStorageAPI.handleHabitData('save', data);
    return new HabitEntity(newHabitData);
  }

  static async delete(id: string): Promise<void> {
    try {
      const data = await HabitStorageAPI.handleHabitData('load');
      const updatedHabits = data.habits.filter(h => h.id !== id);
      await HabitStorageAPI.handleHabitData('save', {
        habits: updatedHabits
      });
      await HabitStorageAPI.refreshWidgets();
    } catch (error) {
      errorHandler.handleError(error, 'Failed to delete habit');
      throw error;
    }
  }

  async syncWithStorage(): Promise<void> {
    try {
      const data = await HabitStorageAPI.handleHabitData('load');
      const storedHabit = data.habits.find(h => h.id === this.id);
      if (storedHabit) {
        this.update({
          quantity: storedHabit.quantity,
          isChecked: storedHabit.isChecked,
          isComplete: storedHabit.isComplete,
          isBegun: storedHabit.isBegun,
          history: storedHabit.history
        });
      }
    } catch (error) {
      errorHandler.handleError(error, 'Failed to sync with storage');
      throw error;
    }
  }

  getValueForDate(date: Date) {
    const dateKey = formatDateKey(date);
    return this.history[dateKey];
  }

  getStatusForDate(date: Date): 'complete' | 'partial' | 'none' {
    const value = this.getValueForDate(date);
    if (Array.isArray(value)) {
      return getHabitStatus(value[0], this);
    }
    return getHabitStatus(value, this);
  }
}
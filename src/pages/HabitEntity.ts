// HabitEntity.ts
import { formatDateKey, getHabitStatus } from './Utilities';
import { Habit } from './Types';
import { HabitStorageAPI } from './Storage';
import { errorHandler } from './ErrorUtilities'

export class HabitEntity {
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
  get history(): Record<string, [number, number] | boolean> { return this.props.history; }

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
            updatedHabit.history[dateKey] = [updates.quantity, updates.goal || 0];
        } else if (this.type === 'checkbox' && typeof updates.isChecked === 'boolean') {
            updatedHabit.history[dateKey] = updates.isChecked;
        }
    }

    await HabitStorageAPI.handleHabitData('save', data);
    this.props = updatedHabit; // Update the local habitData
  }

  async increment(amount: number = 1): Promise<void> {
    if (this.type !== 'quantity') {
      throw new Error('Invalid habit for increment operation');
    }
    const newQuantity = Math.max(0, this.quantity + amount);
    await this.update({
      quantity: newQuantity,
      isComplete: this.goal ? newQuantity >= this.goal : false
    });
  }

  async setChecked(checked: boolean, date: Date = new Date()): Promise<void> {
    if (this.type !== 'checkbox') {
        throw new Error('Invalid habit for checkbox operation');
    }

    const dateKey = formatDateKey(date);
    const updatedHistory = {
        ...this.history,  // Preserve existing history
        [dateKey]: checked  // Add/update just this date
    };

    await this.update({
        isChecked: checked,
        isComplete: checked,
        history: updatedHistory
    }, date);
}

  async rewriteHistory(value: [ number, number ] | boolean, date: Date): Promise<void> {
    const history = {
      [formatDateKey(date)]: value
    };
    await this.update({ history });
  }

  async setValue(value: number, date: Date = new Date()): Promise<void> {
    if (this.type !== 'quantity') {
        throw new Error('Invalid habit for value operation');
    }
    
    const dateKey = formatDateKey(date);
    const historicalValue = this.history[dateKey];
    const currentGoal = Array.isArray(historicalValue) ? historicalValue[1] : this.goal || 0;
    
    // Create new history object that preserves existing entries
    const updatedHistory = {
        ...this.history,  // Spread existing history
        [dateKey]: [value, currentGoal]  // Update only the specific date
    };
    
    await this.update({
        quantity: value,
        isComplete: currentGoal ? value >= currentGoal : value > 0,
        history: updatedHistory as Record<string, [number, number] | boolean>
    }, date);
}

  static async loadAll(): Promise<HabitEntity[]> {
    const data = await HabitStorageAPI.handleHabitData('load');
    return data.habits.map(habitData => new HabitEntity(habitData));
  }

  static async create(props: Habit.Habit): Promise<HabitEntity> {
    const storage = await HabitStorageAPI.handleHabitData('load');
    const existingIndex = storage.habits.findIndex(habit => habit.id === props.id);
    
    if (existingIndex !== -1) {
        storage.habits[existingIndex] = { ...storage.habits[existingIndex], ...props };
    } else {
        const newId = props.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newProps = { ...props, id: newId };
        storage.habits.push(newProps);
    }

    await HabitStorageAPI.handleHabitData('save', storage);
    
    // Create the entity
    const entity = new HabitEntity(props);
    
    return entity;
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

  getValueForDate(date: Date) {
    const dateKey = formatDateKey(date);
    const value = this.history[dateKey];
    
    if (this.type === 'checkbox') {
      return typeof value === 'boolean' ? value : false;
    }
    
    // For quantity type, return the array directly
    if (Array.isArray(value)) {
      return value;
    }
    
    return undefined;
  }

  getStatusForDate(date: Date): 'complete' | 'partial' | 'none' {
    const value = this.getValueForDate(date);
    return getHabitStatus(value, this);
  }
}
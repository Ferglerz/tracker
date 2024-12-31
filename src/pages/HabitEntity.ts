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
  get history(): Record<string, Habit.HistoryEntry> { return this.props.history; }
  get listOrder(): number { return this.props.listOrder; }
  get widget(): Habit.Widget | undefined { return this.props.widget; }

  private async update(updates: Partial<Habit.Habit>, date: Date = new Date()): Promise<void> {
    const data = await HabitStorageAPI.handleHabitData('load');
    const habitIndex = data.habits.findIndex(h => h.id === this.id);

    if (habitIndex === -1) {
        throw new Error('Habit not found in storage');
    }

    // Merge the updates with the current habit data
    const updatedHabit = { 
        ...data.habits[habitIndex], 
        ...updates,
        // Ensure goal is properly preserved/updated
        goal: updates.goal !== undefined ? updates.goal : data.habits[habitIndex].goal
    };
    
    data.habits[habitIndex] = updatedHabit;
    await HabitStorageAPI.handleHabitData('save', data);
    this.props = updatedHabit;
}

  async increment(amount: number = 1): Promise<void> {
    if (this.type !== 'quantity') {
      throw new Error('Invalid habit for increment operation');
    }
    const newQuantity = Math.max(0, this.quantity + amount);
    
    const dateKey = formatDateKey(new Date());
    const currentEntry = this.history[dateKey] || { quantity: 0, goal: this.goal || 0, isChecked: false };
    const updatedHistory = {
      ...this.history,
      [dateKey]: {
        ...currentEntry,
        quantity: newQuantity
      }
    };

    await this.update({
      quantity: newQuantity,
      isComplete: this.goal ? newQuantity >= this.goal : false,
      history: updatedHistory
    });
  }

  async setChecked(checked: boolean, date: Date = new Date()): Promise<void> {
    if (this.type !== 'checkbox') {
        throw new Error('Invalid habit for checkbox operation');
    }

    const dateKey = formatDateKey(date);
    const updatedHistory = {
        ...this.history,
        [dateKey]: {
            quantity: 0,
            goal: 0,
            isChecked: checked
        }
    };

    await this.update({
        isChecked: checked,
        isComplete: checked,
        history: updatedHistory
    }, date);
  }

  async updateWidget(widget?: Habit.Widget): Promise<void> {
    await this.update({
      widget
    });
  }


  async setValue(value: number, date: Date = new Date(), goal?: number): Promise<void> {
    if (this.type !== 'quantity') {
        throw new Error('Invalid habit for value operation');
    }
    
    const dateKey = formatDateKey(date);
    const historicalValue = this.history[dateKey];
    const currentGoal = goal ?? (historicalValue?.goal ?? this.goal ?? 0);
    
    const updatedHistory = {
        ...this.history,
        [dateKey]: {
            quantity: value,
            goal: currentGoal,
            isChecked: false
        }
    };
    
    const updates = {
        quantity: value,
        isComplete: currentGoal ? value >= currentGoal : value > 0,
        history: updatedHistory,
    };
    
    await this.update(updates, date);
}

  static async loadAll(): Promise<HabitEntity[]> {
    const data = await HabitStorageAPI.handleHabitData('load');
    return data.habits.map(habitData => new HabitEntity(habitData));
  }

  static async create(props: Habit.Habit): Promise<HabitEntity> {
    const storage = await HabitStorageAPI.handleHabitData('load');
    const existingIndex = storage.habits.findIndex(habit => habit.id === props.id);
    
    if (!props.listOrder) {
        const maxOrder = Math.max(...storage.habits.map(h => h.listOrder || 0), 0);
        props.listOrder = maxOrder + 1;
    }
    
    if (existingIndex !== -1) {
        storage.habits[existingIndex] = { ...storage.habits[existingIndex], ...props };
    } else {
        const newId = props.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newProps = { ...props, id: newId };
        storage.habits.push(newProps);
    }

    await HabitStorageAPI.handleHabitData('save', storage);
    return new HabitEntity(props);
  }

  static async updateListOrder(habits: HabitEntity[]): Promise<void> {
    const storage = await HabitStorageAPI.handleHabitData('load');
    
    storage.habits = storage.habits.map(habit => {
        const updatedHabit = habits.find(h => h.id === habit.id);
        if (updatedHabit) {
            return { ...habit, listOrder: updatedHabit.listOrder };
        }
        return habit;
    });

    await HabitStorageAPI.handleHabitData('save', storage);
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

  getValueForDate(date: Date): Habit.HistoryEntry | undefined {
    const dateKey = formatDateKey(date);
    return this.history[dateKey];
}

  getStatusForDate(date: Date): 'complete' | 'partial' | 'none' {
    const value = this.getValueForDate(date);
    return getHabitStatus(value, this);
  }
}
import { getHabitStatus, getTodayString } from '@utils/Utilities';
import { Habit } from '@utils/TypesAndProps';
import  { HabitStorageWrapper } from '@utils/Storage';

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
  get isComplete(): boolean { return this.props.isComplete; }
  get history(): Record<string, Habit.HistoryEntry> { return this.props.history; }
  get listOrder(): number { return this.props.listOrder; }
  get widgets(): Habit.Widgets | undefined { return this.props.widget; }

  private getTodayString(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private async update(updates: Partial<Habit.Habit>, dateString?: string): Promise<void> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    const habitIndex = data.habits.findIndex(h => h.id === this.id);

    if (habitIndex === -1) {
      throw new Error('Habit not found in storage');
    }

    const currentEntry = this.history[dateString || this.getTodayString()] || {
      quantity: 0,
      goal: this.goal || 0
    };

    // If there are history updates, merge them with existing history
    if (updates.history) {
      updates.history = {
        ...this.history,
        [dateString || this.getTodayString()]: {
          ...currentEntry,
          ...updates.history[dateString || this.getTodayString()]
        }
      };
    }

    // Merge the updates with the current habit data
    const updatedHabit = {
      ...data.habits[habitIndex],
      ...updates,
      goal: updates.goal !== undefined ? updates.goal : data.habits[habitIndex].goal // TODO: Simplify? Should be in updates?
    };

    data.habits[habitIndex] = updatedHabit;
    await HabitStorageWrapper.handleHabitData('save', data, this.id);
    this.props = updatedHabit;
  }

  async increment(amount: number = 1, dateString: string = this.getTodayString()): Promise<void> {
    const currentEntry = this.history[dateString] || { quantity: 0, goal: this.goal || 0 };
    const newQuantity = Math.max(0, currentEntry.quantity + amount);

    const updatedHistory = {
      [dateString]: {
        ...currentEntry,
        quantity: newQuantity
      }
    };

    await this.update({
      quantity: newQuantity,
      isComplete: this.goal ? newQuantity >= this.goal : newQuantity > 0,
      history: updatedHistory
    }, dateString);
  }

  async updateWidgetAssignment(widget?: Habit.Widgets): Promise<void> {
    await this.update({
      widget
    });
  }

  static async loadAll(): Promise<HabitEntity[]> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    return data.habits.map(habitData => new HabitEntity(habitData));
  }

  static async create(props: Habit.Habit): Promise<HabitEntity> {
    const storage = await HabitStorageWrapper.handleHabitData('load');
    const existingIndex = storage.habits.findIndex(habit => habit.id === props.id);
    const today = getTodayString();

    if (!props.listOrder) {
      const maxOrder = Math.max(...storage.habits.map(h => h.listOrder || 0), 0);
      props.listOrder = maxOrder + 1;
    }

    // Handle goal updates for existing habits
    if (existingIndex !== -1) {
      const existingHabit = storage.habits[existingIndex];
      if (props.goal !== existingHabit.goal) {
        const todayEntry = existingHabit.history[today];
        if (todayEntry) {
          props.history = {
            ...props.history,
            [today]: {
              ...todayEntry,
              goal: props.goal ?? 0
            }
          };
        }
      }
      storage.habits[existingIndex] = { ...existingHabit, ...props };
    } else {
      const newId = props.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newProps = { ...props, id: newId };
      storage.habits.push(newProps);
    }

    await HabitStorageWrapper.handleHabitData('save', storage, props.id);
    return new HabitEntity(props);
  }

  static async updateListOrder(habits: HabitEntity[]): Promise<void> {
    const storage = await HabitStorageWrapper.handleHabitData('load');

    storage.habits = storage.habits.map(habit => {
      const updatedHabit = habits.find(h => h.id === habit.id);
      if (updatedHabit) {
        return { ...habit, listOrder: updatedHabit.listOrder };
      }
      return habit;
    });

    // In this case, we don't pass a specific habit ID since multiple habits are updated
    await HabitStorageWrapper.handleHabitData('save', storage);
  }

  static async delete(id: string): Promise<void> {
    try {
      const data = await HabitStorageWrapper.handleHabitData('load');
      const updatedHabits = data.habits.filter(h => h.id !== id);
      await HabitStorageWrapper.handleHabitData('save', {
        habits: updatedHabits
      }, id);
      await HabitStorageWrapper.refreshWidgets();
    } catch (error) {
      alert('Failed to delete habit');
      throw error;
    }
  }

  getStatusForDate(dateString: string): 'complete' | 'partial' | 'none' {
    const value = this.history[dateString];
    return getHabitStatus(value, this);
  }
}
import { getHabitStatus, getTodayString } from '@utils/Utilities';
import { Habit } from '@utils/TypesAndProps';
import { HabitStorageWrapper } from '@utils/Storage';
import { BehaviorSubject } from 'rxjs';

interface UpdateOptions {
  quantity?: number;
  history?: Record<string, Habit.HistoryEntry>;
  widget?: Habit.Widgets;
  listOrder?: number;
}

// Create a central store for the habits using RxJS BehaviorSubject
const habitsSubject = new BehaviorSubject<Habit.Habit[]>([]);

export class HabitEntity {
  private props: Habit.Habit;

  constructor(props: Habit.Habit) {
    this.props = props;
  }

  // Read-only getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get type(): Habit.Type { return this.props.type; }
  get unit(): string | undefined { return this.props.unit; }
  get goal(): number | undefined { return this.props.goal; }
  get bgColor(): string { return this.props.bgColor; }
  get quantity(): number { return this.props.quantity; }
  get history(): Record<string, Habit.HistoryEntry> { return this.props.history; }
  get listOrder(): number | undefined { return this.props.listOrder; }
  get widgetAssignment(): Habit.Widgets | undefined { return this.props.widgets; }

  async update(updates: UpdateOptions, dateString?: string): Promise<void> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    const habitIndex = data.habits.findIndex(h => h.id === this.id);

    if (habitIndex === -1) {
      throw new Error('Habit not found in storage');
    }

    const date = dateString || getTodayString();
    const currentEntry = this.history[date] || {
      quantity: 0,
      goal: this.goal || 0
    };

    if (updates.history) {
      updates.history = {
        ...this.history,
        [date]: {
          ...currentEntry,
          ...updates.history[date]
        }
      };
    }

    const updatedHabit = {
      ...data.habits[habitIndex],
      ...updates
    };

    data.habits[habitIndex] = updatedHabit;
    await HabitStorageWrapper.handleHabitData('save', data, this.id);
    this.props = updatedHabit;

    // Create a new habit state that preserves the selected date's information
    const newHabitState = data.habits.map(habit => {
      if (habit.id === this.id) {
          return {
              ...habit,
              quantity: habit.history[date]?.quantity ?? 0,
              goal: habit.history[date]?.goal ?? habit.goal ?? 0
          };
      }
      return habit;
  });

    // Update the central store after any update to the habit
    habitsSubject.next(newHabitState);
  }

  async increment(amount: number = 1, dateString: string = getTodayString()): Promise<void> {
    const currentEntry = this.history[dateString] || {
      quantity: 0,
      goal: this.goal
    };
    const newQuantity = Math.max(0, currentEntry.quantity + amount);

    await this.update({
      quantity: newQuantity,
      history: {
        [dateString]: { ...currentEntry, quantity: newQuantity }
      }
    }, dateString);
  }

  async updateWidgetAssignment(widget?: Habit.Widgets): Promise<void> {
    await this.update({ widget });
  }

  static async loadAll(): Promise<HabitEntity[]> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    const habits = data.habits.map(habitData => new HabitEntity(habitData));
    habitsSubject.next(data.habits); // Initialize the store with loaded habits
    return habits;
  }

  static async forceRefresh(): Promise<Habit.Habit[]> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    habitsSubject.next(data.habits);
    return data.habits;
  }

  static getHabits$() {
    return habitsSubject.asObservable();
  }

  static async create(props: Habit.Habit): Promise<HabitEntity> {
    const storage = await HabitStorageWrapper.handleHabitData('load');
    const existingIndex = storage.habits.findIndex(habit => habit.id === props.id);
    const today = getTodayString();

    if (!props.listOrder) {
      const maxOrder = Math.max(...storage.habits.map(h => h.listOrder || 0), 0);
      props.listOrder = maxOrder + 1;
    }

    if (existingIndex !== -1) {
      const existingHabit = storage.habits[existingIndex];
      const updatedHistory = { ...props.history };

      // Update all history entries with new goal if it changed
      if (props.goal !== existingHabit.goal) {
        Object.keys(updatedHistory).forEach(date => {
          updatedHistory[date] = {
            ...updatedHistory[date],
            goal: props.goal ?? 0
          };
        });
      }

      props.history = updatedHistory;
      storage.habits[existingIndex] = { ...existingHabit, ...props };
    } else {
      const newId = props.id || this.generateId();
      storage.habits.push({ ...props, id: newId });
    }

    await HabitStorageWrapper.handleHabitData('save', storage, props.id);
    return new HabitEntity(props);
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static async updateListOrder(habits: HabitEntity[]): Promise<void> {
    const storage = await HabitStorageWrapper.handleHabitData('load');

    storage.habits = storage.habits.map(habit => ({
      ...habit,
      listOrder: habits.find(h => h.id === habit.id)?.listOrder ?? habit.listOrder
    }));

    await HabitStorageWrapper.handleHabitData('save', storage);
    habitsSubject.next(storage.habits); // Update the central store after updating list order
  }

  static async delete(id: string): Promise<void> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    const updatedHabits = data.habits.filter(h => h.id !== id);
    await HabitStorageWrapper.handleHabitData('save', { habits: updatedHabits }, id);
    habitsSubject.next(updatedHabits); // Update the central store after deleting a habit
    await HabitStorageWrapper.refreshWidgets();
  }

  getStatusForDate(dateString: string): 'complete' | 'partial' | 'none' {
    const value = this.history[dateString];
    return getHabitStatus(value, this);
  }
}
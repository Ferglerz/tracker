import { getHabitStatus, getTodayString } from '@utils/Utilities';
import { Habit } from '@utils/TypesAndProps';
import { HabitStorageWrapper } from '@utils/Storage';
import { BehaviorSubject } from 'rxjs';

export interface UpdateOptions {
  quantity?: number;
  goal?: number;
  history?: Record<string, Habit.HistoryEntry>;
  widget?: Habit.Widgets;
  listOrder?: number;
  dateString?: string; 
}

const habitsSubject = new BehaviorSubject<Habit.Habit[]>([]);

export class HabitEntity {
  constructor(private props: Habit.Habit) {}

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get type() { return this.props.type; }
  get unit() { return this.props.unit; }
  get goal() { return this.props.goal; }
  get bgColor() { return this.props.bgColor; }
  get quantity() { return this.props.quantity; }
  get history() { return this.props.history; }
  get listOrder() { return this.props.listOrder; }
  get widgetAssignment() { return this.props.widgets; }

  async update(updates: UpdateOptions): Promise<void> { 
    const dateString = updates.dateString || getTodayString(); 
    const data = await HabitStorageWrapper.handleHabitData('load');
    const habitIndex = data.habits.findIndex(h => h.id === this.id);

    if (habitIndex === -1) throw new Error('Habit not found in storage');

    const currentEntry = this.history[dateString] || { quantity: 0, goal: this.goal || 0 };

    if (updates.history) {
      updates.history = {
        ...this.history,
        [dateString]: {
          quantity: updates.history[dateString]?.quantity ?? currentEntry.quantity,
          goal: updates.history[dateString]?.goal ?? currentEntry.goal
        }
      };
    }

    const updatedHabit = { ...data.habits[habitIndex], ...updates };
    data.habits[habitIndex] = updatedHabit;
    await HabitStorageWrapper.handleHabitData('save', data);
    this.props = updatedHabit;

    habitsSubject.next(data.habits.map(habit => 
      habit.id === this.id 
        ? { ...habit, quantity: habit.history[dateString]?.quantity ?? 0, goal: habit.history[dateString]?.goal ?? habit.goal ?? 0 } 
        : habit
    ));
  }

  async increment(amount = 1, dateString = getTodayString()): Promise<void> {
    await this.update({ 
      dateString: dateString,
      quantity: Math.max(0, this.quantity + amount),
      history: { [dateString]: { quantity: Math.max(0, this.quantity + amount), goal: this.goal || 0 } } 
    }); 
  }

  async updateWidgetAssignment(widget?: Habit.Widgets): Promise<void> {
    await this.update({ widget }); 
  }

  static async loadAll(): Promise<HabitEntity[]> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    const habits = data.habits.map(habitData => new HabitEntity(habitData));
    habitsSubject.next(data.habits);
    return habits;
  }

  static getHabits$() {
    return habitsSubject.asObservable();
  }

  static async create(props: Habit.Habit): Promise<HabitEntity> {
    const storage = await HabitStorageWrapper.handleHabitData('load');
    const existingIndex = storage.habits.findIndex(habit => habit.id === props.id);

    if (!props.listOrder) {
      props.listOrder = Math.max(...storage.habits.map(h => h.listOrder || 0), 0) + 1;
    }

    if (existingIndex !== -1) {
      if (props.goal !== storage.habits[existingIndex].goal) {
        Object.keys(props.history).forEach(date => {
          props.history[date].goal = props.goal ?? 0;
        });
      }
      storage.habits[existingIndex] = { ...storage.habits[existingIndex], ...props };
    } else {
      storage.habits.push({ ...props, id: props.id || `${Date.now()}-${Math.random().toString(20).substring(2, 10)}` });
    }

    await HabitStorageWrapper.handleHabitData('save', storage);
    return new HabitEntity(props);
  }

  static async updateListOrder(habits: HabitEntity[]): Promise<void> {
    const storage = await HabitStorageWrapper.handleHabitData('load');
    storage.habits = storage.habits.map(habit => ({
      ...habit,
      listOrder: habits.find(h => h.id === habit.id)?.listOrder ?? habit.listOrder
    }));
    await HabitStorageWrapper.handleHabitData('save', storage);
    habitsSubject.next(storage.habits);
  }

  static async delete(id: string): Promise<void> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    const updatedHabits = data.habits.filter(h => h.id !== id);
    await HabitStorageWrapper.handleHabitData('save', { habits: updatedHabits });
    habitsSubject.next(updatedHabits);
    await HabitStorageWrapper.refreshWidgets();
  }

  getStatusForDate(dateString: string): 'complete' | 'partial' | 'none' {
    return getHabitStatus(this.history[dateString], this);
  }
}
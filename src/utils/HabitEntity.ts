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
  get icon() { return this.props.icon; }
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
  
    // Update history separately from other updates
    let updatedHistory = this.history;
    if (updates.history) {
      const currentEntry = this.history[dateString] || { quantity: 0, goal: this.goal || 0 };
      updatedHistory = {
        ...this.history,
        [dateString]: {
          quantity: updates.history[dateString]?.quantity ?? currentEntry.quantity,
          goal: updates.history[dateString]?.goal ?? currentEntry.goal,
        },
      };
    }
  
    // Handle widget assignments properly
    const updatedWidgets = updates.widget !== undefined ? updates.widget : this.props.widgets;
  
    // Construct the updated habit, ensuring all properties are merged correctly
    const updatedHabit = { 
      ...data.habits[habitIndex],
      ...updates,
      history: updatedHistory,
      widgets: updatedWidgets, // Ensure widgets are included
    };
  
    // Update the habit in the data array
    data.habits[habitIndex] = updatedHabit;
  
    // Save the updated data
    await HabitStorageWrapper.handleHabitData('save', data);
  
    // Update the internal props to reflect the changes
    this.props = updatedHabit;
  
    // Emit the updated habits array
    habitsSubject.next(data.habits);
  }

  async increment(amount = 1, dateString: string): Promise<void> {
    const today = getTodayString();
    dateString = dateString || today;
  
    // Load fresh data to avoid stale state
    const data = await HabitStorageWrapper.handleHabitData('load');
    const freshHabit = data.habits.find(h => h.id === this.id);
    if (!freshHabit) throw new Error('Habit not found');
  
    // Get the current history entry from fresh data
    const currentHistoryEntry = freshHabit.history[dateString] || { 
      quantity: 0, 
      goal: freshHabit.goal || 0 
    };
    
    const newHistoryQuantity = Math.max(0, currentHistoryEntry.quantity + amount);
    
    // Update both quantity (for today) and history
    const newQuantity = dateString === today ? 
      Math.max(0, (freshHabit.quantity || 0) + amount) : 
      freshHabit.quantity || 0;
  
    await this.update({
      dateString: dateString,
      quantity: newQuantity,
      history: {
        [dateString]: { 
          quantity: newHistoryQuantity, 
          goal: freshHabit.goal || 0 
        },
      },
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
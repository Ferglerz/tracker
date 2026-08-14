import { getHabitStatus, getTodayString } from '@utils/Utilities';
import { Habit } from '@utils/TypesAndProps';
import { ParsedHabitData } from '@utils/ImportCSV';
import { HabitStorageWrapper } from '@utils/Storage';
import { BehaviorSubject } from 'rxjs';

export interface UpdateOptions {
  quantity?: number;
  goal?: number;
  history?: Record<string, Habit.HistoryEntry>;
  widget?: Habit.Widgets;
  listOrder?: number;
  dateString?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
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
  get frequency() { return this.props.frequency || 'daily'; }

  static emptyHistoryEntry(goal: number): Habit.HistoryEntry {
    return { quantity: 0, goal: goal ?? 0, note: undefined };
  }

  async update(updates: UpdateOptions, preloadedData?: Habit.Data): Promise<void> {
    const dateString = updates.dateString || getTodayString();
    const data = preloadedData ?? await HabitStorageWrapper.handleHabitData('load');
    const habitIndex = data.habits.findIndex(h => h.id === this.id);

    if (habitIndex === -1) throw new Error('Habit not found in storage');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) throw new Error('Invalid history date');

    const storedHabit = data.habits[habitIndex];
    const storedHistory = storedHabit.history ?? {};

    let updatedHistory = storedHistory;
    if (updates.history) {
      const requestedEntry = updates.history[dateString];
      if (!requestedEntry) throw new Error(`Missing history entry for ${dateString}`);
      const currentEntry = storedHistory[dateString] || HabitEntity.emptyHistoryEntry(storedHabit.goal);
      updatedHistory = {
        ...storedHistory,
        [dateString]: {
          quantity: requestedEntry.quantity ?? currentEntry.quantity,
          goal: requestedEntry.goal ?? currentEntry.goal,
          note: requestedEntry.note !== undefined ? requestedEntry.note : currentEntry.note,
        },
      };
    }

    const updatedHabit: Habit.Habit = {
      ...storedHabit,
      ...(updates.quantity !== undefined ? { quantity: updates.quantity } : {}),
      ...(updates.goal !== undefined ? { goal: updates.goal } : {}),
      ...(updates.listOrder !== undefined ? { listOrder: updates.listOrder } : {}),
      ...(updates.frequency !== undefined ? { frequency: updates.frequency } : {}),
      history: updatedHistory,
      widgets: updates.widget !== undefined ? updates.widget : storedHabit.widgets,
    };

    data.habits[habitIndex] = updatedHabit;
    await HabitStorageWrapper.handleHabitData('save', data);
    this.props = updatedHabit;
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
    const currentHistoryEntry = freshHabit.history?.[dateString] || HabitEntity.emptyHistoryEntry(freshHabit.goal);

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
          goal: freshHabit.goal || 0,
          note: currentHistoryEntry.note
        },
      },
    }, data);
  }

  async updateWidgetAssignment(widget?: Habit.Widgets): Promise<void> {
    await this.update({ widget });
  }

  /** Single save after multiple widget assignment changes (avoids redundant loads/reloads). */
  static async applyWidgetAssignmentBatch(
    updates: { habitId: string; widgets: Habit.Widgets }[],
  ): Promise<void> {
    if (updates.length === 0) return;
    const data = await HabitStorageWrapper.handleHabitData('load');
    for (const { habitId, widgets } of updates) {
      const idx = data.habits.findIndex((h) => h.id === habitId);
      if (idx === -1) continue;
      data.habits[idx] = { ...data.habits[idx], widgets };
    }
    await HabitStorageWrapper.handleHabitData('save', data);
    habitsSubject.next(data.habits);
  }

  static async loadAll(): Promise<HabitEntity[]> {
    await HabitStorageWrapper.refreshWidgets();
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
    const storedProps: Habit.Habit = {
      ...props,
      id: props.id || `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
      history: { ...(props.history ?? {}) },
    };

    if (storedProps.listOrder === undefined) {
      storedProps.listOrder = Math.max(...storage.habits.map(h => h.listOrder || 0), 0) + 1;
    }

    if (existingIndex !== -1) {
      if (storedProps.goal !== storage.habits[existingIndex].goal) {
        Object.keys(storedProps.history).forEach(date => {
          storedProps.history[date] = {
            ...storedProps.history[date],
            goal: storedProps.goal ?? 0,
          };
        });
      }
      storage.habits[existingIndex] = { ...storage.habits[existingIndex], ...storedProps };
    } else {
      storage.habits.push(storedProps);
    }

    await HabitStorageWrapper.handleHabitData('save', storage);
    habitsSubject.next(storage.habits);
    const savedHabit = storage.habits.find(habit => habit.id === storedProps.id);
    if (!savedHabit) throw new Error('Created habit was not stored');
    return new HabitEntity(savedHabit);
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

  static async mergeImportedData(importedData: ParsedHabitData[]): Promise<void> {
    const data = await HabitStorageWrapper.handleHabitData('load');

    importedData.forEach(importedHabit => {
      let existingHabit = data.habits.find(h => h.name === importedHabit.name);

      if (!existingHabit) {
        existingHabit = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          name: importedHabit.name,
          type: importedHabit.type,
          unit: importedHabit.unit,
          goal: 1,
          bgColor: 'var(--ion-color-primary)', // Default color
          quantity: 0,
          history: {},
          listOrder: Math.max(...data.habits.map(h => h.listOrder || 0), 0) + 1,
          frequency: 'daily'
        };
        data.habits.push(existingHabit);
      }

      // Merge history
      importedHabit.values.forEach((val) => {
        // Always overwrite the quantity, keep existing goal if we have one
        const currentGoal = existingHabit!.history?.[val.date]?.goal || existingHabit!.goal;
        existingHabit!.history = existingHabit!.history ?? {};
        existingHabit!.history[val.date] = {
           quantity: val.value.quantity,
           goal: currentGoal,
           note: existingHabit!.history[val.date]?.note
        };
      });
    });

    await HabitStorageWrapper.handleHabitData('save', data);
    habitsSubject.next(data.habits);
  }

  static async delete(id: string): Promise<void> {
    const data = await HabitStorageWrapper.handleHabitData('load');
    const updatedHabits = data.habits.filter(h => h.id !== id);
    await HabitStorageWrapper.handleHabitData('save', { ...data, habits: updatedHabits });
    habitsSubject.next(updatedHabits);
  }

  getStatusForDate(dateString: string): 'complete' | 'partial' | 'none' {
    return getHabitStatus(this.history[dateString], this);
  }
}
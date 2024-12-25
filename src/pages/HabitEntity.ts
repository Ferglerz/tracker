// HabitEntity.ts
import { Subject, Observable } from 'rxjs';
import { formatDateKey, getHabitStatus } from './HabitUtils';
import { Habit } from './HabitTypes';

export class HabitEntity {
  private changeSubject = new Subject<void>();
  private history: Record<string, number | boolean> = {};
  
  constructor(
    private props: Habit.Base,
    private state: Habit.State = {
      quantity: 0,
      isChecked: false,
      isComplete: false,
      isBegun: false
    }
  ) {}

  // Read-only getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get type(): Habit.Type { return this.props.type; }
  get unit(): string | undefined { return this.props.unit; }
  get goal(): number | undefined { return this.props.goal; }
  get bgColor(): string { return this.props.bgColor; }
  get quantity(): number { return this.state.quantity; }
  get isChecked(): boolean { return this.state.isChecked; }
  get isComplete(): boolean { return this.state.isComplete; }
  get isBegun(): boolean { return this.state.isBegun; }

  get changes(): Observable<void> {
    return this.changeSubject.asObservable();
  }

  // Internal methods - only called by HabitRegistry
  _updateProps(updates: Partial<Habit.Base>): void {
    this.props = { ...this.props, ...updates };
    this.changeSubject.next();
  }

  _updateState(updates: Partial<Habit.State>, date?: Date): void {
    this.state = { ...this.state, ...updates };
    
    // Update history if date is provided
    if (date) {
      const dateKey = formatDateKey(date);
      if (dateKey) {
        const value = this.type === 'checkbox' ? this.state.isChecked : this.state.quantity;
        this.history[dateKey] = value;
      }
    }
    
    this.changeSubject.next();
  }

  setHistory(history: Record<string, number | boolean>): void {
    console.log(`Setting history for habit ${this.id}:`, history);
    this.history = { ...history };
    this.changeSubject.next();
}

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

  async getAllHistory(): Promise<Record<string, number | boolean>> {
    return { ...this.history };
  }

  // Data conversion method
  toJSON(): Habit.Model {
    return {
      ...this.props,
      ...this.state
    };
  }
}
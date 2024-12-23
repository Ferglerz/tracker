// HabitEntity.ts
import { Subject, Observable } from 'rxjs';
import { formatDateKey, getHabitStatus } from './HabitUtils';
import { Habit } from './HabitTypes';
import { HabitRegistry } from './HabitRegistry';

export class HabitEntity {
  private changeSubject = new Subject<void>();
  
  private _quantity: number = 0;
  private _isChecked: boolean = false;
  private _isComplete: boolean = false;
  private _isBegun: boolean = false;

  constructor(
    private props: Habit.Base,
    private history: Record<string, number | boolean> = {}
  ) {}

  // Getters
  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get type(): Habit.Type { return this.props.type; }
  get unit(): string | undefined { return this.props.unit; }
  get goal(): number | undefined { return this.props.goal; }
  get bgColor(): string { return this.props.bgColor; }
  get quantity(): number { return this._quantity; }
  get isChecked(): boolean { return this._isChecked; }
  get isComplete(): boolean { return this._isComplete; }
  get isBegun(): boolean { return this._isBegun; }

  get changes(): Observable<void> {
    return this.changeSubject.asObservable();
  }

  updateProperties(updates: Partial<Habit.Base>): void {
    this.props = { ...this.props, ...updates };
    this.changeSubject.next();
  }

  setHistory(history: Record<string, number | boolean>): void {
    this.history = { ...history };
  }

  async getAllHistory(): Promise<Record<string, number | boolean>> {
    return { ...this.history };
  }

// HabitEntity.ts
async updateState(
  updates: Partial<Habit.State>,
  date: Date = new Date(),
  skipStorageUpdate: boolean = false // Add flag to prevent storage updates
): Promise<void> {
  // Update instance variables
  if (updates.quantity !== undefined) {
    this._quantity = updates.quantity;
  }
  if (updates.isChecked !== undefined) {
    this._isChecked = updates.isChecked;
  }

  // Update derived states
  this._isBegun = this.type === 'checkbox' ? 
    this._isChecked : 
    this._quantity > 0;

  this._isComplete = this.type === 'checkbox' ? 
    this._isChecked : 
    (this.goal ? this._quantity >= this.goal : this._quantity > 0);

  // Save to history
  const dateKey = formatDateKey(date);
  const value = this.type === 'checkbox' ? this._isChecked : this._quantity;
  this.history[dateKey] = value;

  // Only trigger storage update if not skipped
  if (!skipStorageUpdate) {
    // Trigger update in registry
    await HabitRegistry.update({
      ...this.props,
      quantity: this._quantity,
      isChecked: this._isChecked,
      isComplete: this._isComplete,
      isBegun: this._isBegun
    });
  }

  // Notify observers AFTER all updates are complete
  this.changeSubject.next();
}

  async increment(amount: number = 1): Promise<void> {
    if (this.type !== 'quantity') return;

    const newQuantity = Math.max(0, this._quantity + amount);
    const newIsBegun = newQuantity > 0;
    const newIsComplete = this.goal ? newQuantity >= this.goal : false;

    await this.updateState({
        quantity: newQuantity,
        isBegun: newIsBegun,
        isComplete: newIsComplete
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

  toJSON(): Habit.Model {
    return {
      ...this.props,
      quantity: this._quantity,
      isChecked: this._isChecked,
      isComplete: this._isComplete,
      isBegun: this._isBegun
    };
  }
}
// HabitTypes.ts
export namespace Habit {
  export type Type = 'checkbox' | 'quantity';

  export interface HistoryEntry {
    quantity: number;
    goal: number;
    isChecked: boolean;
  }

  export interface Habit {
    id: string;
    name: string;
    type: Type;
    unit?: string;
    goal?: number;
    bgColor: string;
    quantity: number;
    isChecked: boolean;
    isComplete: boolean;
    listOrder: number;
    history: {
      [date: string]: HistoryEntry;
    };
  }

  export interface Data {
    habits: Habit[];
  }
}
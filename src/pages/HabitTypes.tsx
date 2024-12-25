// HabitTypes.ts
export namespace Habit {
  export type Type = 'checkbox' | 'quantity';

  export interface Habit { // Renamed from Base to DataEntry
    id: string;
    name: string;
    type: Type;
    unit?: string;
    goal?: number;
    bgColor: string;
    quantity: number;
    isChecked: boolean;
    isComplete: boolean;
    isBegun: boolean;
    history: {
      [date: string]: [ number, number ] | boolean;
    };
  }

  // Used by HabitStorage.ts
  export interface Data {
    habits: Habit[];
  }
}
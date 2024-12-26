// HabitTypes.ts
export namespace Habit {
  export type Type = 'checkbox' | 'quantity';

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
    listOrder: number; // Add this line
    history: {
      [date: string]: [ number, number ] | boolean;
    };
  }

  // Used by HabitStorage.ts
  export interface Data {
    habits: Habit[];
  }
}
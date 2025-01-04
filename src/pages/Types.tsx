// HabitTypes.ts
export namespace Habit {
  export type Type = 'checkbox' | 'quantity';

  export interface HistoryEntry {
    quantity: number;
    goal: number;
    isChecked: boolean;
  }

  export interface WidgetsAssignment {
    type: string;
    order: number;
}

export interface Widgets {
    assignments: WidgetsAssignment[];
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
    widget?: Widgets;
    history: {
      [date: string]: HistoryEntry;
    };
  }

  export interface Data {
    habits: Habit[];
  }
}
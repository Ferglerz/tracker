// HabitTypes.ts
export namespace Habit {
  export type Type = 'checkbox' | 'quantity';

  export interface HistoryEntry {
    quantity: number;
    goal: number;
    isChecked: boolean;
  }

  export interface WidgetAssignment {
    type: string;
    order: number;
}

export interface Widget {
    assignments: WidgetAssignment[];
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
    widget?: Widget;
    history: {
      [date: string]: HistoryEntry;
    };
  }

  export interface Data {
    habits: Habit[];
  }
}
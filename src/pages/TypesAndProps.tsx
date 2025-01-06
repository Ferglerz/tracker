
import { HistoryValue } from "./HistoryGrid";

export namespace Habit {
  export type Type = 'checkbox' | 'quantity';



  export interface WidgetsAssignment {
    type: string;
    order: number;
  }

  export interface Widgets {
    assignments: WidgetsAssignment[];
  }

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
    widget?: Widgets;
    history: {
      [date: string]: HistoryEntry;
    };
  }

  export interface Data {
    habits: Habit[];
  }
}

export interface HistoryGridProps {
  data: Array<{ date: string; value: HistoryValue; }>;
  color: string;
  type: Habit.Type;
  baseSize?: number;
  gap?: number;
  rowPadding?: number;
  cellsPerRow?: number;
}
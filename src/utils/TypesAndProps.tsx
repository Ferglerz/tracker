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
  }

  export interface Habit {
    id: string;
    name: string;
    type: Type;
    unit?: string;
    goal?: number;
    bgColor: string;
    quantity: number;
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
  data: Array<{ date: string; value: [number, number]; }>;
  color: string;
  type: Habit.Type;
  baseSize?: number;
  gap?: number;
  rowPadding?: number;
  cellsPerRow?: number;
}

export interface StorageStrategy {
  save(key: string, value: Habit.Data): Promise<void>;
  load(key: string): Promise<Habit.Data | null>;
  clear(key: string): Promise<void>;
}
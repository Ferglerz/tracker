import type { HabitEntity } from './HabitEntity';

export namespace Habit {
  export type Type = 'checkbox' | 'quantity';

  export interface HistoryEntry {
    quantity: number;
    goal: number;
  }

  export interface Habit {
    id: string;
    name: string;
    type: Type;
    unit?: string;
    goal: number;
    bgColor: string;
    icon?: string;
    quantity: number;
    history: {
      [date: string]: HistoryEntry;
    };
    listOrder?: number;
    widgets?: Widgets;
  }

  export interface Data {
    habits: Habit[];
  }

  export interface WidgetsAssignment {
    type: string;
    order: number;
  }

  export interface Widgets {
    assignments: WidgetsAssignment[];
  }
}

export interface AppSettings {
  historyGrid?: boolean;
  [key: string]: unknown;
}

export interface InteractionControlsProps {
  habit: HabitEntity;
  handleValueChange: (value: number, date: string) => void;
  selectedDate: string;
}

export interface HistoryGridProps {
  data: Array<{ date: string; value: [number, number] }>;
  color: string;
  type: Habit.Type;
  baseSize?: number;
  gap?: number;
  rowPadding?: number;
  cellsPerRow?: number;
  hideGrid?: boolean;
}

export interface CalendarProps {
  habit: Habit.Habit;
  onClose: () => void;
  onValueChange: (newValue: number) => void;
  onDateSelected: (date: string) => void;
}

export interface CalendarDayProps {
  date: Date;
  habit: Habit.Habit;
  isSelected: boolean;
  onValueChange: (newValue: number) => void;
  onDateSelected: () => void;
}

export interface StorageStrategy {
  save(key: string, value: any): Promise<void>;
  load(key: string): Promise<any>;
  clear(key: string): Promise<void>;
}

export interface IconCategoryItem {
  name: string;
  icon: string;
  description: string;
}

export interface IconCategory {
  name: string;
  icons: IconCategoryItem[];
}

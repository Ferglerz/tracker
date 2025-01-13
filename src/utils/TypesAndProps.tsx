import { HabitEntity } from "./HabitEntity";

export namespace Habit {
  export type Type = 'checkbox' | 'quantity';

  export interface HistoryEntry {
    quantity: number | 0;
    goal: number | 0;
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

export interface HabitItemState {
  selectedDate: string;
  quantity: number;
  goal: number;
}

export interface InteractionControlsProps {
  habit: HabitEntity;
  handleValueChange: (value: number, date: string, habit: HabitEntity) => void;
  selectedDate: string;
}

export interface HistoryGridProps {
  data: Array<{ date: string; value: [number, number]; }>;
  color: string;
  type: Habit.Type;
  baseSize?: number;
  gap?: number;
  rowPadding?: number;
  cellsPerRow?: number;
  history: Record<string, Habit.HistoryEntry>;
  defaultGoal: number;
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

export interface Props {
  habit: Habit.Habit;
  onEdit: () => void;
  onDelete: () => void;
  isCalendarOpen: boolean;
  openCalendarId: string | null;
  onToggleCalendar: (habitId: string) => void;
  dragHandleProps?: any;
}

export interface StorageStrategy {
  save(key: string, value: Habit.Data): Promise<void>;
  load(key: string): Promise<Habit.Data | null>;
  clear(key: string): Promise<void>;
}
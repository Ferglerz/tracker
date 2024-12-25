// HabitTypes.ts

export namespace Habit {
  export type Type = 'checkbox' | 'quantity';

  export interface Base {
    id: string;
    name: string;
    type: Type;
    unit?: string;
    goal?: number;
    bgColor: string;
    lastModified: number; // Add this
  }

  export interface State {
    quantity: number;
    isChecked: boolean;
    isComplete: boolean;
    isBegun: boolean;
  }

  export interface Model extends Base, State {
    lastModified?: number;
  }

  export interface History {
    [habitId: string]: {
      [date: string]: number | boolean;
    }
  }

  export interface Data {
    habits: Model[];
    history: History;
  }

  export interface RouteState {
    habitData?: Base;
  }

  export interface Stats {
    totalDays: number;
    completedDays: number;
    partialDays: number;
    streak: number;
    longestStreak: number;
    averageValue: number;
  }

  export interface Filter {
    type?: Type;
    searchTerm?: string;
    startDate?: Date;
    endDate?: Date;
    isComplete?: boolean;
  }

  export interface Sort {
    field: 'name' | 'created' | 'lastUpdated' | 'completion';
    direction: 'asc' | 'desc';
  }

  export type ChangeEvent = {
    habit: Model;
    type: 'update' | 'delete' | 'create';
    timestamp: number;
  }

  export interface CalendarHighlight {
    date: string;
    textColor: string;
    backgroundColor: string;
  }

  export type ViewMode = 'list' | 'grid' | 'calendar';

  export interface ImportData {
    habits: Base[];
    history: History;
  }
}
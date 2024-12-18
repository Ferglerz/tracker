import type { HabitModel } from './HabitModel';

export type HabitType = 'checkbox' | 'quantity';

export interface HabitStats {
  totalDays: number;
  completedDays: number;
  partialDays: number;
  streak: number;
  longestStreak: number;
  averageValue: number;
}

export interface HabitFilter {
  type?: HabitType;
  searchTerm?: string;
  startDate?: Date;
  endDate?: Date;
  isComplete?: boolean;
}

export interface HabitSort {
  field: 'name' | 'created' | 'lastUpdated' | 'completion';
  direction: 'asc' | 'desc';
}

export type HabitChangeEvent = {
  habit: HabitModel;
  type: 'update' | 'delete' | 'create';
  timestamp: number;
};

export type HabitBulkOperation = {
  habitIds: string[];
  operation: 'delete' | 'update' | 'duplicate';
  value?: number | boolean;
};

export interface CalendarHighlight {
  date: string;
  textColor: string;
  backgroundColor: string;
}

export type HabitViewMode = 'list' | 'grid' | 'calendar';

export interface HabitImportData {
  habits: Parameters<typeof HabitModel.create>[0][];
  history: Record<string, Record<string, number | boolean>>;
}
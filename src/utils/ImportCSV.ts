// HabitCSVService.ts
import { format } from 'date-fns';
import Papa from 'papaparse';
import { Habit } from '@utils/TypesAndProps';
import { HabitEntity } from '@utils/HabitEntity';

interface CSVRow {
  Date: string;
  [habitName: string]: string;
}

interface ParsedHabitData {
  name: string;
  unit?: string;
  type: Habit.Type;
  values: { 
    date: string; 
    value: Habit.HistoryEntry; 
  }[];
}

interface ParseResult {
  data: any[];
  meta: {
    fields?: string[];
  };
  errors: any[];
}

export class HabitCSVService {
  private static createDownload(content: string, filename: string) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  private static parseHabitHeader(header: string) {
    const match = header.match(/^"?([^"]+)"?(?:\s*\(([^)]+)\))?$/);
    return {
      name: match?.[1] || header,
      unit: match?.[2]
    };
  }

  static async exportHabits(habits: HabitEntity[]): Promise<void> {
    if (!habits.length) {
      throw new Error('No habits available to export');
    }

    const habitHistories = habits.map(habit => ({
      habit,
      history: habit.history
    }));

    const allDates = [...new Set(habitHistories.flatMap(({ history }) => Object.keys(history)))].sort();
    
    if (!allDates.length) {
      throw new Error('No data available to export');
    }

    const headers = ['Date', ...habits.map(h => 
      `${h.name.includes(',') ? `"${h.name}"` : h.name}${h.unit ? ` (${h.unit})` : ''}`
    )];

    const rows = allDates.map(date => {
      const row: CSVRow = { Date: date };
      habitHistories.forEach(({ habit, history }) => {
        row[habit.name] = history[date]?.quantity?.toString() ?? '';
      });
      return Object.values(row);
    });

    try {
      const csv = Papa.unparse([headers, ...rows]);
      this.createDownload(csv, `habit-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      alert('Failed to export habits to CSV');
      throw error;
    }
  }

  static async parseCSVFile(file: File): Promise<ParsedHabitData[]> {
    const results = await new Promise<ParseResult>((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      });
    });

    if (!results.data.length || !results.meta.fields?.includes('Date')) {
      throw new Error('CSV file is empty or invalid');
    }

    const habitColumns = results.meta.fields
      .filter(field => field !== 'Date')
      .map(header => {
        const { name, unit } = this.parseHabitHeader(header);
        return {
          name,
          unit,
          type: unit ? 'quantity' as const : 'checkbox' as const,
          values: []
        };
      });

    results.data.forEach((row: Record<string, any>) => {
      const date = row.Date;
      if (!date || isNaN(new Date(date).getTime())) return;

      habitColumns.forEach(habit => {
        const rawValue = row[habit.name];
        if (rawValue === undefined || rawValue === '') return;

        const quantity = habit.type === 'checkbox'
          ? Number(['1', 'true', 'yes', 'y'].includes(String(rawValue).toLowerCase()))
          : Number(rawValue);

        if (!isNaN(quantity)) {
          (habit.values as Array<{ date: string; value: { quantity: number; goal: number } }>).push({
            date,
            value: { quantity, goal: 0 }
          });
        }
      });    });

    if (!habitColumns.some(habit => habit.values.length > 0)) {
      throw new Error('No valid habit data found in CSV');
    }

    return habitColumns;
  }
}
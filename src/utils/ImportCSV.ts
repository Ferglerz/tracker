// HabitCSVService.ts
import { format } from 'date-fns';
import Papa from 'papaparse';
import { Habit } from '@utils/TypesAndProps';
import { HabitEntity } from '@utils/HabitEntity';

interface CSVRow {
  Date: string;
  [habitName: string]: string;
}

export interface ParsedHabitData {
  name: string;
  unit?: string;
  type: Habit.Type;
  values: {
    date: string;
    value: Habit.HistoryEntry;
  }[];
}

interface ParseResult {
  data: Record<string, unknown>[];
  meta: {
    fields?: string[];
  };
  errors: Array<{ row?: number; message: string }>;
}

export class HabitCSVService {
  static readonly MAX_IMPORT_BYTES = 5 * 1024 * 1024;

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
    const match = header.trim().match(/^(.*?)\s*\(([^()]*)\)$/);
    return {
      name: (match?.[1] || header).trim(),
      unit: match?.[2]?.trim() || undefined,
    };
  }

  private static normalizeDate(value: unknown): string | null {
    const text = String(value ?? '').trim();
    const canonical = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:$|T)/);
    if (canonical) {
      const year = Number(canonical[1]);
      const month = Number(canonical[2]);
      const day = Number(canonical[3]);
      const local = new Date(year, month - 1, day);
      if (
        local.getFullYear() !== year ||
        local.getMonth() !== month - 1 ||
        local.getDate() !== day
      ) return null;
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return null;
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  }

  static async exportHabits(habits: HabitEntity[]): Promise<void> {
    if (!habits.length) {
      throw new Error('No habits available to export');
    }

    const habitHistories = habits.map(habit => habit.history);

    const allDates = [...new Set(habitHistories.flatMap(history => Object.keys(history)))].sort();

    if (!allDates.length) {
      throw new Error('No data available to export');
    }

    const habitHeaders = habits.map(h => `${h.name}${h.unit ? ` (${h.unit})` : ''}`);
    const headers = ['Date', ...habitHeaders];

    const rows = allDates.map(date => {
      const row: CSVRow = { Date: date };
      habitHistories.forEach((history, index) => {
        row[habitHeaders[index]] = history[date]?.quantity?.toString() ?? '';
      });
      return Object.values(row);
    });

    const csv = Papa.unparse([headers, ...rows]);
    this.createDownload(csv, `habit-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  }

  static async parseCSVFile(file: File): Promise<ParsedHabitData[]> {
    if (file.size > this.MAX_IMPORT_BYTES) {
      throw new Error(`CSV file exceeds ${this.MAX_IMPORT_BYTES / 1024 / 1024} MB limit`);
    }

    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
    const results = await new Promise<ParseResult>((resolve, reject) => {
      Papa.parse(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      });
    });

    if (results.errors.length) {
      const first = results.errors[0];
      const row = first.row === undefined ? '' : ` on row ${first.row + 1}`;
      throw new Error(`CSV parse error${row}: ${first.message}`);
    }

    if (!results.data.length || !results.meta.fields?.includes('Date')) {
      throw new Error('CSV file is empty or invalid');
    }

    const habitColumns = results.meta.fields
      .filter(field => field !== 'Date')
      .map(header => {
        const { name, unit } = this.parseHabitHeader(header);
        return {
          header,
          name,
          unit,
          type: unit ? 'quantity' as const : 'checkbox' as const,
          values: []
        };
      });

    results.data.forEach((row, rowIndex) => {
      const date = this.normalizeDate(row.Date);
      if (!date) {
        throw new Error(`Invalid date on CSV row ${rowIndex + 2}`);
      }

      habitColumns.forEach(habit => {
        const rawValue = row[habit.header];
        if (rawValue === undefined || rawValue === '') return;

        const normalizedValue = String(rawValue).trim().toLowerCase();
        const checkboxValues: Record<string, number> = {
          '1': 1,
          true: 1,
          yes: 1,
          y: 1,
          '0': 0,
          false: 0,
          no: 0,
          n: 0,
        };
        const quantity = habit.type === 'checkbox'
          ? checkboxValues[normalizedValue]
          : Number(rawValue);

        if (!Number.isFinite(quantity)) {
          throw new Error(`Invalid value for "${habit.name}" on CSV row ${rowIndex + 2}`);
        }
        (habit.values as Array<{ date: string; value: { quantity: number; goal: number } }>).push({
          date,
          value: { quantity, goal: 0 }
        });
      });
    });

    if (!habitColumns.some(habit => habit.values.length > 0)) {
      throw new Error('No valid habit data found in CSV');
    }

    return habitColumns.map(column => ({
      name: column.name,
      unit: column.unit,
      type: column.type,
      values: column.values,
    }));
  }
}
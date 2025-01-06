// HabitCSVService.ts
import { format } from 'date-fns';
import Papa from 'papaparse';
import { Habit } from './TypesAndProps';
import { HabitEntity } from './HabitEntity';

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
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  private static parseHabitHeader(header: string): { name: string; unit?: string } {
    const match = header.match(/^"?([^"]+)"?(?:\s*\(([^)]+)\))?$/);
    return {
      name: match?.[1] || header,
      unit: match?.[2]
    };
  }

  static async exportHabits(habits: HabitEntity[]): Promise<void> {
    try {
      if (!habits.length) {
        throw new Error('No habits available to export');
      }

      const habitHistories = await Promise.all(
        habits.map(async habit => ({
          habit,
          history: habit.history
        }))
      );

      const allDates = new Set<string>();
      habitHistories.forEach(({ history }) => {
        Object.keys(history).forEach(date => allDates.add(date));
      });

      const sortedDates = Array.from(allDates).sort();
      if (!sortedDates.length) {
        throw new Error('No data available to export');
      }

      const headers = ['Date', ...habits.map(h => {
        const name = h.name.includes(',') ? `"${h.name}"` : h.name;
        return `${name}${h.unit ? ` (${h.unit})` : ''}`;
      })];

      const rows = sortedDates.map(date => {
        const row: CSVRow = { Date: date };
        habitHistories.forEach(({ habit, history }) => {
          const value = history[date];
          row[habit.name] = habit.type === 'checkbox' ? 
            (value?.isChecked ? '1' : '0') : 
            value?.quantity?.toString() ?? '';
        });
        return row;
      });

      const csv = Papa.unparse([headers, ...rows.map(row => Object.values(row))]);
      this.createDownload(csv, `habit-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
    } catch (error) {
      alert('Failed to export habits to CSV');
      throw error;
    }
  }

  static async parseCSVFile(file: File): Promise<ParsedHabitData[]> {
    const parseCSV = async (file: File): Promise<ParseResult> => {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results),
          error: (error) => reject(error)
        });
      });
    };

    try {
      const results = await parseCSV(file);

      if (!results.data.length || !results.meta.fields) {
        throw new Error('CSV file is empty or invalid');
      }

      if (!results.meta.fields.includes('Date')) {
        throw new Error('CSV must contain a Date column');
      }

      const habitColumns = results.meta.fields
        .filter(field => field !== 'Date')
        .map(header => {
          const { name, unit } = this.parseHabitHeader(header);
          return {
            name,
            unit,
            type: unit ? 'quantity' as const : 'checkbox' as const,
            values: [] as { date: string; value: Habit.HistoryEntry }[]
          };
        });

      results.data.forEach((row: Record<string, any>) => {
        const date = row.Date;
        if (!date || isNaN(new Date(date).getTime())) {
          return;
        }

        habitColumns.forEach(habit => {
          const rawValue = row[habit.name];
          if (rawValue === undefined || rawValue === '') {
            return;
          }

          let historyEntry: Habit.HistoryEntry;
          
          if (habit.type === 'checkbox') {
            const isChecked = typeof rawValue === 'boolean' ? rawValue :
                            typeof rawValue === 'number' ? rawValue === 1 :
                            typeof rawValue === 'string' ? ['1', 'true', 'yes', 'y'].includes(rawValue.toLowerCase()) :
                            false;
            
            historyEntry = {
              quantity: 0,
              goal: 0,
              isChecked
            };
          } else {
            const numValue = Number(rawValue);
            if (isNaN(numValue)) {
              return;
            }
            historyEntry = {
              quantity: numValue,
              goal: 0,
              isChecked: false
            };
          }

          habit.values.push({ date, value: historyEntry });
        });
      });

      if (!habitColumns.some(habit => habit.values.length > 0)) {
        throw new Error('No valid habit data found in CSV');
      }

      return habitColumns;

    } catch (error) {
      const enhancedError = new Error(
        `Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      throw enhancedError;
    }
  }
}
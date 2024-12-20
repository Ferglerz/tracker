// HabitCSVService.ts
import { format } from 'date-fns';
import Papa from 'papaparse';
import { Habit } from './HabitTypes';
import { HabitEntity } from './HabitEntity';
import { HabitRegistry } from './HabitRegistry';
import { errorHandler } from './ErrorUtils';
import { formatDateKey } from './HabitUtils';

interface CSVRow {
  Date: string;
  [habitName: string]: string;
}

interface ParsedHabitData {
  name: string;
  unit?: string;
  type: Habit.Type;
  values: { date: string; value: number | boolean }[];
}

export class HabitCSVService {
  private static createDownload(content: string, filename: string) {
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
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

  private static async getHabitHistory(habit: HabitEntity): Promise<Record<string, number | boolean>> {
    try {
      return await habit.getAllHistory();
    } catch (error) {
      errorHandler.handleError(error, `Failed to get history for habit: ${habit.name}`);
      return {};
    }
  }

  static async exportHabits(habits: HabitEntity[]): Promise<void> {
    try {
      if (!habits.length) {
        throw new Error('No habits available to export');
      }

      // Collect all histories and find unique dates
      const habitHistories = await Promise.all(
        habits.map(async habit => ({
          habit,
          history: await this.getHabitHistory(habit)
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

      // Create headers
      const headers = ['Date', ...habits.map(h => {
        const name = h.name.includes(',') ? `"${h.name}"` : h.name;
        return `${name}${h.unit ? ` (${h.unit})` : ''}`;
      })];

      // Create CSV rows
      const rows = sortedDates.map(date => {
        const row: CSVRow = { Date: date };
        habitHistories.forEach(({ habit, history }) => {
          const value = history[date];
          row[habit.name] = typeof value === 'boolean' ? 
            (value ? '1' : '0') : 
            value?.toString() ?? '';
        });
        return row;
      });

      const csv = Papa.unparse([headers, ...rows.map(row => Object.values(row))]);
      this.createDownload(csv, `habit-tracker-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
    } catch (error) {
      errorHandler.handleError(error, 'Failed to export habits to CSV');
      throw error;
    }
  }

  static async importHabits(file: File): Promise<void> {
    try {
      const habitData = await this.parseCSVFile(file);
      
      for (const data of habitData) {
        const habitProps: Habit.Base = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: data.name,
          type: data.type,
          unit: data.unit,
          bgColor: '#b5ead7', // Default color
        };
        
        const habit = await HabitRegistry.create(habitProps);
        
        // Import values
        for (const { date, value } of data.values) {
          const dateObj = new Date(date);
          if (data.type === 'checkbox') {
            await habit.setChecked(value as boolean, dateObj);
          } else if (typeof value === 'number') {
            await habit.setValue(value, dateObj);
          }
        }
      }
      
      errorHandler.showInfo('Import completed successfully');
    } catch (error) {
      errorHandler.handleError(error, 'Failed to import habits');
      throw error;
    }
  }

  static async parseCSVFile(file: File): Promise<ParsedHabitData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            if (!results.data.length || !results.meta.fields) {
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
                  values: [] as { date: string; value: number | boolean }[]
                };
              });

            // Parse values for each habit
            results.data.forEach((row: any) => {
              const date = row.Date;
              if (!date || isNaN(new Date(date).getTime())) {
                return; // Skip invalid dates
              }

              habitColumns.forEach(habit => {
                const rawValue = row[habit.name];
                if (rawValue === undefined || rawValue === '') return;

                let value: number | boolean;
                if (habit.type === 'checkbox') {
                  value = rawValue === '1' || rawValue === true;
                } else {
                  value = Number(rawValue);
                }

                if (typeof value === 'number' && !isNaN(value) || typeof value === 'boolean') {
                  habit.values.push({ date, value });
                }
              });
            });

            resolve(habitColumns);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error)
      });
    });
  }
}
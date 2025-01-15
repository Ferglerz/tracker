// NativeStorageStrategy.ts
import { Habit, StorageStrategy } from "@utils/TypesAndProps";
import { WidgetsBridgePlugin } from "capacitor-widgetsbridge-plugin";

export class NativeStorageStrategy implements StorageStrategy {
  private group: string;

  constructor(group: string) {
    this.group = group;
  }

  async save(key: string, value: Habit.Data): Promise<void> {
    try {
      await WidgetsBridgePlugin.setItem({
        key: String(key),
        value: JSON.stringify(value),
        group: String(this.group)
      });

    } catch (error) {
      console.error('Failed to save to native storage:', error);
      throw error;
    }
  }

  async load(key: string): Promise<Habit.Data | null> {
    try {
      const result = await WidgetsBridgePlugin.getItem({
        key: String(key),
        group: String(this.group)
      });

      if (result && result.results) {
        try {
          const parsedResult = JSON.parse(result.results);
          return parsedResult;
        } catch (parseError) {
          console.error("Failed to parse data from native storage:", parseError);
          return this.getDefaultData();
        }
      } else {
        console.warn("Loaded data is null. Returning default data.");
        return this.getDefaultData();
      }
    } catch (error) {
      console.error(`Native storage load error:`, error);
      return this.getDefaultData();
    }
  }

  async clear(key: string): Promise<void> {
    await WidgetsBridgePlugin.removeItem({
      key: String(key),
      group: String(this.group)
    });
  }

  private getDefaultData(): Habit.Data {
    return { habits: [] };
  }
}
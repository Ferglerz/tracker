// NativeStorageStrategy.ts
import { StorageStrategy } from "@utils/TypesAndProps";
import { WidgetsBridgePlugin } from "capacitor-widgetsbridge-plugin";

export class NativeStorageStrategy implements StorageStrategy {
  private group: string;

  constructor(group: string) {
    this.group = group;
  }

  async save(key: string, value: unknown): Promise<void> {
    try {
      await WidgetsBridgePlugin.setItem({
        key,
        value: JSON.stringify(value),
        group: this.group
      });
    } catch (error) {
      console.error('Failed to save to native storage:', error);
      throw error;
    }
  }

  async load(key: string): Promise<any | null> {
    try {
      const result = await WidgetsBridgePlugin.getItem({
        key,
        group: this.group
      });

      if (result && result.results) {
        return JSON.parse(result.results);
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Native storage load error:`, error);
      throw error;
    }
  }

  async clear(key: string): Promise<void> {
    await WidgetsBridgePlugin.removeItem({
      key,
      group: this.group
    });
  }
}
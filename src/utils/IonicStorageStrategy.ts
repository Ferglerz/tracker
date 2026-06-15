import { StorageStrategy } from "@utils/TypesAndProps";
import { Storage } from '@ionic/storage';

export class IonicStorageStrategy implements StorageStrategy {
  private storage: Storage | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        if (!this.storage) {
          this.storage = new Storage();
          await this.storage.create();
        }
      })();
    }
    return this.initPromise;
  }

  async save(key: string, value: any): Promise<void> {
    await this.initialize();
    await this.storage!.set(key, JSON.stringify(value));
  }

  async load(key: string): Promise<any | null> {
    await this.initialize();
    const result = await this.storage!.get(key);
    return result ? JSON.parse(result) : null;
  }

  async clear(key: string): Promise<void> {
    await this.initialize();
    await this.storage!.remove(key);
  }
}

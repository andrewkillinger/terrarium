export class StorageService {
  private readonly storage: Storage | null;
  private readonly fallback = new Map<string, string>();

  constructor(private readonly namespace = 'terrarium') {
    this.storage = this.resolveStorage();
  }

  set<T>(key: string, value: T): void {
    const serialized = JSON.stringify(value);
    this.write(this.buildKey(key), serialized);
  }

  get<T>(key: string, defaultValue: T | null = null): T | null {
    const raw = this.read(this.buildKey(key));

    if (raw === null) {
      return defaultValue;
    }

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`Failed to parse stored value for key "${key}"`, error);
      return defaultValue;
    }
  }

  remove(key: string): void {
    this.delete(this.buildKey(key));
  }

  clear(): void {
    if (this.storage) {
      const prefix = `${this.namespace}:`;
      for (let i = this.storage.length - 1; i >= 0; i -= 1) {
        const storageKey = this.storage.key(i);
        if (storageKey && storageKey.startsWith(prefix)) {
          this.storage.removeItem(storageKey);
        }
      }
    }

    this.fallback.clear();
  }

  private buildKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private resolveStorage(): Storage | null {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return null;
    }

    try {
      const storage = window.localStorage;
      const testKey = `${this.namespace}__test`;
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return storage;
    } catch (error) {
      console.warn('LocalStorage is not available, falling back to in-memory storage.', error);
      return null;
    }
  }

  private write(key: string, value: string): void {
    if (this.storage) {
      this.storage.setItem(key, value);
    } else {
      this.fallback.set(key, value);
    }
  }

  private read(key: string): string | null {
    if (this.storage) {
      return this.storage.getItem(key);
    }

    return this.fallback.get(key) ?? null;
  }

  private delete(key: string): void {
    if (this.storage) {
      this.storage.removeItem(key);
    } else {
      this.fallback.delete(key);
    }
  }
}

export const storageService = new StorageService();

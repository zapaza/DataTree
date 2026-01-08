import type { TDataType } from '@/types/editor';

export interface THistoryItem {
  id?: number;
  timestamp: number;
  content: string;
  format: TDataType;
  isValid: boolean;
  nodesCount: number;
}

const DB_NAME = 'DataTreeHistoryDB';
const STORE_NAME = 'history';
const DB_VERSION = 1;

export class HistoryDB {
  private db: IDBDatabase | null = null;

  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async save(item: THistoryItem): Promise<number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  public async getAll(): Promise<THistoryItem[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as THistoryItem[];
        resolve(items.sort((a, b) => b.timestamp - a.timestamp));
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async trim(limit: number): Promise<void> {
    const items = await this.getAll();
    if (items.length <= limit) return;

    const db = await this.init();
    const toDelete = items.slice(limit);

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    toDelete.forEach(item => {
      if (item.id !== undefined) {
        store.delete(item.id);
      }
    });
  }

  public async clear(): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async delete(id: number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const historyDB = new HistoryDB();

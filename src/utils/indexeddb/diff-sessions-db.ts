import type { TDataType } from '@/types/editor'

export type TDiffSessionId = string

export interface TDiffSession {
  id: TDiffSessionId
  title: string
  createdAt: number
  updatedAt: number

  leftRaw: string
  rightRaw: string
  leftFormat: TDataType
  rightFormat: TDataType
  showOnlyChanges: boolean

  // Optional cached diff (may be null for huge files)
  diffResult?: any | null
  diffTree?: any | null

  sizeBytes: number
}

export interface TDiffBackup {
  id: string
  sessionId: TDiffSessionId
  createdAt: number
  payload: Omit<TDiffSession, 'id' | 'createdAt' | 'updatedAt' | 'title'> & {
    title?: string
  }
  sizeBytes: number
}

const DB_NAME = 'DataTreeDiffDB'
const DB_VERSION = 1

const STORE_SESSIONS = 'diff_sessions'
const STORE_BACKUPS = 'diff_backups'
const STORE_META = 'meta'

type TMetaRecord = { key: string; value: any }

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export class DiffSessionsDB {
  private db: IDBDatabase | null = null

  private async init(): Promise<IDBDatabase> {
    if (this.db) return this.db
    return await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          const store = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORE_BACKUPS)) {
          const store = db.createObjectStore(STORE_BACKUPS, { keyPath: 'id' })
          store.createIndex('sessionId', 'sessionId', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
        }

        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' })
        }
      }

      req.onsuccess = () => {
        this.db = req.result
        resolve(req.result)
      }
      req.onerror = () => reject(req.error)
    })
  }

  async getMeta<T = any>(key: string): Promise<T | null> {
    const db = await this.init()
    const tx = db.transaction([STORE_META], 'readonly')
    const store = tx.objectStore(STORE_META)
    const rec = await requestToPromise<TMetaRecord | undefined>(store.get(key))
    await txDone(tx)
    return rec ? (rec.value as T) : null
  }

  async setMeta(key: string, value: any): Promise<void> {
    const db = await this.init()
    const tx = db.transaction([STORE_META], 'readwrite')
    tx.objectStore(STORE_META).put({ key, value } satisfies TMetaRecord)
    await txDone(tx)
  }

  async upsertSession(session: TDiffSession): Promise<void> {
    const db = await this.init()
    const tx = db.transaction([STORE_SESSIONS], 'readwrite')
    tx.objectStore(STORE_SESSIONS).put(session)
    await txDone(tx)
  }

  async getSession(id: TDiffSessionId): Promise<TDiffSession | null> {
    const db = await this.init()
    const tx = db.transaction([STORE_SESSIONS], 'readonly')
    const store = tx.objectStore(STORE_SESSIONS)
    const res = await requestToPromise<TDiffSession | undefined>(store.get(id))
    await txDone(tx)
    return res || null
  }

  async deleteSession(id: TDiffSessionId): Promise<void> {
    const db = await this.init()
    const tx = db.transaction([STORE_SESSIONS, STORE_BACKUPS], 'readwrite')
    tx.objectStore(STORE_SESSIONS).delete(id)

    // delete backups by sessionId
    const backupsStore = tx.objectStore(STORE_BACKUPS)
    const idx = backupsStore.index('sessionId')
    const cursorReq = idx.openCursor(IDBKeyRange.only(id))
    await new Promise<void>((resolve, reject) => {
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result
        if (!cursor) return resolve()
        cursor.delete()
        cursor.continue()
      }
      cursorReq.onerror = () => reject(cursorReq.error)
    })

    await txDone(tx)
  }

  async listSessions(limit = 100): Promise<TDiffSession[]> {
    const db = await this.init()
    const tx = db.transaction([STORE_SESSIONS], 'readonly')
    const store = tx.objectStore(STORE_SESSIONS)
    const idx = store.index('updatedAt')
    const res: TDiffSession[] = []

    // Iterate newest first
    const cursorReq = idx.openCursor(null, 'prev')
    await new Promise<void>((resolve, reject) => {
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result
        if (!cursor) return resolve()
        res.push(cursor.value as TDiffSession)
        if (res.length >= limit) return resolve()
        cursor.continue()
      }
      cursorReq.onerror = () => reject(cursorReq.error)
    })

    await txDone(tx)
    return res
  }

  async createBackup(backup: TDiffBackup): Promise<void> {
    const db = await this.init()
    const tx = db.transaction([STORE_BACKUPS], 'readwrite')
    tx.objectStore(STORE_BACKUPS).put(backup)
    await txDone(tx)
  }

  async getLatestBackup(sessionId: TDiffSessionId): Promise<TDiffBackup | null> {
    const db = await this.init()
    const tx = db.transaction([STORE_BACKUPS], 'readonly')
    const store = tx.objectStore(STORE_BACKUPS)
    const idx = store.index('sessionId')
    const backups: TDiffBackup[] = []
    const cursorReq = idx.openCursor(IDBKeyRange.only(sessionId))
    await new Promise<void>((resolve, reject) => {
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result
        if (!cursor) return resolve()
        backups.push(cursor.value as TDiffBackup)
        cursor.continue()
      }
      cursorReq.onerror = () => reject(cursorReq.error)
    })
    await txDone(tx)
    if (backups.length === 0) return null
    backups.sort((a, b) => b.createdAt - a.createdAt)
    return backups[0] || null
  }

  async estimateTotalSizeBytes(): Promise<number> {
    const sessions = await this.listSessions(1000)
    return sessions.reduce((sum, s) => sum + (s.sizeBytes || 0), 0)
  }

  async garbageCollect(opts: { retentionDays: number; maxSessions: number; maxTotalBytes: number }): Promise<void> {
    const retentionMs = Math.max(1, opts.retentionDays) * 24 * 60 * 60 * 1000
    const now = Date.now()

    const sessions = await this.listSessions(1000)
    const toDeleteByAge = sessions.filter(s => now - s.updatedAt > retentionMs)
    for (const s of toDeleteByAge) {
      await this.deleteSession(s.id)
    }

    const remaining = await this.listSessions(1000)
    // Enforce maxSessions (keep newest)
    if (remaining.length > opts.maxSessions) {
      const overflow = remaining.slice(opts.maxSessions)
      for (const s of overflow) await this.deleteSession(s.id)
    }

    // Enforce maxTotalBytes (best-effort, delete oldest until under)
    let afterLimit = await this.listSessions(1000)
    let total = afterLimit.reduce((sum, s) => sum + (s.sizeBytes || 0), 0)
    if (total > opts.maxTotalBytes) {
      // sort oldest first to delete
      afterLimit = afterLimit.slice().sort((a, b) => a.updatedAt - b.updatedAt)
      for (const s of afterLimit) {
        if (total <= opts.maxTotalBytes) break
        total -= (s.sizeBytes || 0)
        await this.deleteSession(s.id)
      }
    }
  }
}

export const diffSessionsDB = new DiffSessionsDB()


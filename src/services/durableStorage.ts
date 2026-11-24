/**
 * Durable key-value storage.
 *
 * - In-memory cache is the source of truth during a session.
 * - Values are mirrored to localStorage (sync) and IndexedDB (async backup).
 * - If localStorage is cleared/corrupted by someone else (shared origin,
 *   browser eviction), values are restored from the cache / IndexedDB.
 */

export const STORAGE_KEYS = {
  favorites: "lgtmoon-wrapper/favorites",
  settings: "lgtmoon-wrapper/settings",
  ignoreRanges: "lgtmoon-wrapper/ignore-ranges",
  importMeta: "lgtmoon-wrapper/import-meta",
} as const;

const ALL_KEYS: string[] = Object.values(STORAGE_KEYS);

const DB_NAME = "lgtmoon-wrapper";
const STORE_NAME = "kv";
const IDB_OPEN_TIMEOUT_MS = 3000;

const cache = new Map<string, string>();
let initialized = false;
let persistResult: boolean | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;

function isValidJson(value: string | null | undefined): value is string {
  if (typeof value !== "string") return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error(`[durableStorage] localStorage.setItem failed for ${key}`, err);
    return false;
  }
}

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let settled = false;
    const done = (db: IDBDatabase | null) => {
      if (settled) {
        db?.close();
        return;
      }
      settled = true;
      resolve(db);
    };
    try {
      if (typeof indexedDB === "undefined") return done(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => done(req.result);
      req.onerror = () => {
        console.error("[durableStorage] indexedDB open failed", req.error);
        done(null);
      };
      req.onblocked = () => done(null);
      setTimeout(() => done(null), IDB_OPEN_TIMEOUT_MS);
    } catch (err) {
      console.error("[durableStorage] indexedDB unavailable", err);
      done(null);
    }
  });
  return dbPromise;
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
      req.onsuccess = () =>
        resolve(typeof req.result === "string" ? req.result : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(key: string, value: string): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error(`[durableStorage] IDB put failed for ${key}`, tx.error);
        resolve();
      };
      tx.onabort = () => {
        console.error(`[durableStorage] IDB put aborted for ${key}`, tx.error);
        resolve();
      };
    } catch (err) {
      console.error(`[durableStorage] IDB put failed for ${key}`, err);
      resolve();
    }
  });
}

function restoreCacheToLocalStorage(): void {
  for (const [key, value] of cache) {
    if (lsGet(key) !== value) lsSet(key, value);
  }
}

function onStorageEvent(e: StorageEvent): void {
  if (e.storageArea && e.storageArea !== safeLocalStorage()) return;
  if (e.key === null) {
    // localStorage.clear() somewhere: put our data back.
    restoreCacheToLocalStorage();
    return;
  }
  if (!ALL_KEYS.includes(e.key)) return;
  if (e.newValue === null) {
    const cached = cache.get(e.key);
    if (cached !== undefined) lsSet(e.key, cached);
    return;
  }
  if (isValidJson(e.newValue)) {
    // Another tab of this app wrote it.
    cache.set(e.key, e.newValue);
    void idbPut(e.key, e.newValue);
  } else {
    const cached = cache.get(e.key);
    if (cached !== undefined) lsSet(e.key, cached);
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export async function initDurableStorage(): Promise<void> {
  if (initialized) return;
  initialized = true;

  for (const key of ALL_KEYS) {
    try {
      const lsValue = lsGet(key);
      const idbValue = await idbGet(key);
      const lsValid = isValidJson(lsValue);
      const idbValid = isValidJson(idbValue);

      if (lsValue !== null && !lsValid) {
        const corruptKey = `${key}.corrupt.${new Date().toISOString()}`;
        lsSet(corruptKey, lsValue);
        console.error(
          `[durableStorage] invalid JSON in ${key}; preserved as ${corruptKey}`,
        );
      }

      let chosen: string | null = null;
      if (lsValid) chosen = lsValue;
      else if (idbValid) chosen = idbValue;

      if (chosen !== null) {
        cache.set(key, chosen);
        if (lsValue !== chosen) lsSet(key, chosen);
        if (idbValue !== chosen) await idbPut(key, chosen);
      }
    } catch (err) {
      console.error(`[durableStorage] init failed for ${key}`, err);
    }
  }

  try {
    window.addEventListener("storage", onStorageEvent);
  } catch {
    /* ignore */
  }

  // Don't await: some browsers show a permission prompt and would block rendering.
  try {
    if (typeof navigator.storage?.persist === "function") {
      navigator.storage
        .persist()
        .then((granted) => {
          persistResult = granted;
        })
        .catch(() => {
          /* ignore */
        });
    }
  } catch {
    /* ignore */
  }
}

export function getItem(key: string): string | null {
  if (initialized || cache.has(key)) {
    return cache.get(key) ?? null;
  }
  const raw = lsGet(key);
  return isValidJson(raw) ? raw : null;
}

export function setItem(key: string, value: string): void {
  cache.set(key, value);
  lsSet(key, value);
  void idbPut(key, value);
}

export async function getPersistenceStatus(): Promise<{
  persisted: boolean | null;
}> {
  try {
    if (typeof navigator !== "undefined" && navigator.storage?.persisted) {
      return { persisted: await navigator.storage.persisted() };
    }
  } catch {
    /* fall through */
  }
  return { persisted: persistResult };
}

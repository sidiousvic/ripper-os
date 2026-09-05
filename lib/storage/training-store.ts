import { createStoredHistory, isStoredHistory, type StoredHistory } from "./stored-history.ts";

const DATABASE_NAME = "ripper-os-training";
const DATABASE_VERSION = 1;
const STORE_NAME = "state";
const STATE_KEY = "current";

export type TrainingStoreErrorKind = "unavailable" | "incompatible" | "failed";
export interface TrainingStoreError { kind: TrainingStoreErrorKind; message: string; cause?: unknown }
export type TrainingStoreResult<T> = { ok: true; value: T } | { ok: false; error: TrainingStoreError };

function unavailable(message: string, cause?: unknown): TrainingStoreResult<never> {
  return { ok: false, error: { kind: "unavailable", message, cause } };
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is unavailable in this environment."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the training database."));
  });
}

export async function loadTrainingHistory(): Promise<TrainingStoreResult<StoredHistory | null>> {
  let database: IDBDatabase;
  try { database = await openDatabase(); } catch (cause) { return unavailable("Local training storage is unavailable.", cause); }
  try {
    const value = await new Promise<unknown>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(STATE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Could not read local training storage."));
    });
    database.close();
    if (value == null) return { ok: true, value: null };
    if (!isStoredHistory(value)) return { ok: false, error: { kind: "incompatible", message: "Saved training data uses an unsupported schema version." } };
    return { ok: true, value };
  } catch (cause) { database.close(); return { ok: false, error: { kind: "failed", message: "Could not read local training storage.", cause } }; }
}

export async function saveTrainingHistory(history: StoredHistory): Promise<TrainingStoreResult<null>> {
  if (!isStoredHistory(history)) return { ok: false, error: { kind: "incompatible", message: "Training data does not match the supported schema." } };
  let database: IDBDatabase;
  try { database = await openDatabase(); } catch (cause) { return unavailable("Local training storage is unavailable.", cause); }
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(createStoredHistory(history.imports, history.exerciseOverrides), STATE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save local training storage."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Local training storage transaction was aborted."));
    });
    database.close();
    return { ok: true, value: null };
  } catch (cause) { database.close(); return { ok: false, error: { kind: "failed", message: "Could not save local training storage.", cause } }; }
}

export async function clearTrainingHistory(): Promise<TrainingStoreResult<null>> {
  let database: IDBDatabase;
  try { database = await openDatabase(); } catch (cause) { return unavailable("Local training storage is unavailable.", cause); }
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(STATE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear local training storage."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Local training storage transaction was aborted."));
    });
    database.close();
    return { ok: true, value: null };
  } catch (cause) { database.close(); return { ok: false, error: { kind: "failed", message: "Could not clear local training storage.", cause } }; }
}

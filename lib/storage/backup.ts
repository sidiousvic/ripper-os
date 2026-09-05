import { createStoredHistory, isStoredHistory, type StoredHistory } from "./stored-history.ts";

export const RIPPER_BACKUP_VERSION = 1;
const MAX_BACKUP_BYTES = 8_000_000;

export interface RipperBackup {
  ripperBackupVersion: 1;
  canonicalSchemaVersion: 1;
  createdAt: string;
  history: StoredHistory;
}

export function createBackup(history: StoredHistory, createdAt = new Date().toISOString()): RipperBackup {
  return { ripperBackupVersion: 1, canonicalSchemaVersion: 1, createdAt, history: createStoredHistory(history.imports, history.exerciseOverrides) };
}

export function serializeBackup(history: StoredHistory): string {
  const serialized = JSON.stringify(createBackup(history));
  if (serialized.length > MAX_BACKUP_BYTES) throw new Error("This backup is too large to create safely.");
  return serialized;
}

export function parseBackup(serialized: string): RipperBackup {
  if (serialized.length > MAX_BACKUP_BYTES) throw new Error("This backup is too large to open safely.");
  let value: unknown;
  try { value = JSON.parse(serialized); } catch { throw new Error("This backup is not valid JSON."); }
  if (!value || typeof value !== "object") throw new Error("This backup has an invalid structure.");
  const candidate = value as Partial<RipperBackup>;
  if (candidate.ripperBackupVersion !== 1 || candidate.canonicalSchemaVersion !== 1 || !isStoredHistory(candidate.history)) {
    throw new Error("This backup uses an unsupported Ripper schema version.");
  }
  return candidate as RipperBackup;
}

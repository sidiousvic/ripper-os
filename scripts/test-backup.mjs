import assert from "node:assert/strict";
import { createStoredHistory } from "../lib/storage/stored-history.ts";
import { createBackup, parseBackup, serializeBackup } from "../lib/storage/backup.ts";

const source = createStoredHistory([], { "strong:custom": { keepCustom: true } });
const restored = parseBackup(serializeBackup(source));
assert.deepEqual(restored.history, source);
assert.throws(() => parseBackup(JSON.stringify({ ripperBackupVersion: 2 })), /unsupported/);
assert.throws(() => parseBackup("{"), /valid JSON/);
assert.equal(createBackup(source, "2026-01-01T00:00:00.000Z").createdAt, "2026-01-01T00:00:00.000Z");
console.log("Training backup checks passed.");

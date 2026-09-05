import assert from "node:assert/strict";
import { createStoredHistory, isStoredHistory } from "../lib/storage/stored-history.ts";

const state = createStoredHistory();
assert.equal(isStoredHistory(state), true);
assert.equal(isStoredHistory({ ...state, schemaVersion: 2 }), false);
assert.equal(isStoredHistory({ ...state, imports: "bad" }), false);
assert.deepEqual(createStoredHistory([{ source: "strong" }], { "strong:bench press": { keepCustom: true } }).exerciseOverrides["strong:bench press"], { keepCustom: true });
console.log("Training store schema checks passed.");

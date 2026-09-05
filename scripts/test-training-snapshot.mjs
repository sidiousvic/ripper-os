import assert from "node:assert/strict";
import { saveTrainingSnapshot, TRAINING_SNAPSHOT_KEY } from "../lib/training-snapshot.mjs";

const values = new Map([[TRAINING_SNAPSHOT_KEY, "old-export"]]);
const storage = {
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};
assert.equal(saveTrainingSnapshot("new-export", () => storage), "saved");
assert.equal(values.get(TRAINING_SNAPSHOT_KEY), "new-export");

let attempts = 0;
assert.equal(saveTrainingSnapshot("replacement", () => ({
  ...storage,
  setItem(key, value) {
    if (++attempts === 1) throw new Error("Quota exceeded");
    assert.equal(values.has(key), false);
    storage.setItem(key, value);
  },
})), "saved");
assert.equal(values.get(TRAINING_SNAPSHOT_KEY), "replacement");

assert.equal(saveTrainingSnapshot("replacement", () => ({
  ...storage, setItem() { throw new Error("Quota exceeded"); },
})), "unavailable");
assert.equal(values.has(TRAINING_SNAPSHOT_KEY), false, "Do not restore an older export after a failed save");
values.set(TRAINING_SNAPSHOT_KEY, "old-export");
assert.equal(saveTrainingSnapshot("x".repeat(4_000_001), () => storage), "too-large");
assert.equal(values.has(TRAINING_SNAPSHOT_KEY), false);
assert.equal(saveTrainingSnapshot("replacement", () => { throw new Error("Storage disabled"); }), "unavailable");
console.log("Snapshot replacement: save, quota retry, stale-data removal, size limit, and disabled storage passed");

import assert from "node:assert/strict";
import { estimateE1rmKg } from "../lib/analytics/estimated-1rm.ts";
assert.equal(estimateE1rmKg(80, 8), 101.33333333333333);
assert.equal(estimateE1rmKg(80, 1), 80);
assert.equal(estimateE1rmKg(80, 11), null);
assert.equal(estimateE1rmKg(null, 8), null);
assert.equal(estimateE1rmKg(80, 8, false), null);
console.log("Estimated 1RM checks passed.");

import assert from "node:assert/strict";
import { contextsCompatible } from "../lib/exercises/comparison-context.ts";
const base = { exerciseId: "barbell_bench_press", equipmentInstance: "barbell", loadBasis: "total", mode: "external", comparable: true };
assert.equal(contextsCompatible(base, { ...base }), true);
assert.equal(contextsCompatible(base, { ...base, equipmentInstance: "smith" }), false);
assert.equal(contextsCompatible(base, { ...base, mode: "assistance" }), false);
console.log("Comparison context checks passed.");

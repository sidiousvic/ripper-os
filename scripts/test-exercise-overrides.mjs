import assert from "node:assert/strict";
import { resolveExercise } from "../lib/exercises/resolve.ts";

const mapped = resolveExercise("strong", "Bench Press (Barbell)", { exerciseId: "barbell_bench_press", comparisonKey: "barbell_bench_press" });
assert.equal(mapped.method, "user-override");
assert.equal(mapped.exerciseId, "barbell_bench_press");
const custom = resolveExercise("hevy", "My Custom Press", { keepCustom: true });
assert.equal(custom.method, "user-override");
assert.equal(custom.comparable, false);
console.log("Exercise override precedence checks passed.");

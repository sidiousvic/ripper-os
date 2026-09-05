import { readFile } from "node:fs/promises";
import { inspectInput } from "../lib/import/inspect-input.ts";
import { normalizeMacroFactor } from "../lib/import/adapters/macrofactor.ts";

const filename = process.argv[2];
if (!filename) throw new Error("Usage: node --experimental-strip-types scripts/report-unresolved-exercises.mjs <export.csv|export.xlsx>");
const input = inspectInput(await readFile(filename), filename);
const imported = normalizeMacroFactor(input, filename);
const counts = new Map();
for (const day of imported.exerciseDays) if (day.exerciseId.startsWith("custom_")) counts.set(day.rawExerciseName, (counts.get(day.rawExerciseName) ?? 0) + (day.metrics.totalSets ?? 0));
console.log(JSON.stringify({ unresolvedExercises: counts.size, exercises: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, sets]) => ({ name, sets })) }, null, 2));

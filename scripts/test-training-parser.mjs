import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { parseTrainingFile } from "../lib/training-parser.ts";

const csv = "Date,Exercise,Weight (kg),Reps,Notes\n2026-01-01,Bench Press,100,5,private-note-marker\n2026-01-01,Bench Press,100,5,\n2026-02-01,Bench Press,80,8,\n";
const fromCsv = parseTrainingFile(new TextEncoder().encode(csv), "training.csv");
assert.equal(fromCsv.coverage.totalSessions, 2);
assert.equal(fromCsv.exercises[0].totalSets, 3);
assert.equal(fromCsv.exercises[0].totalReps, 18);
assert.equal(fromCsv.exercises[0].totalVolumeKg, 1640);
assert.equal(fromCsv.achievements.length, 0);
const peakCsv = "Date,Exercise,Weight (kg),Reps\n2026-01-01,Deadlift,100,5\n2026-02-01,Deadlift,120,5\n2026-03-01,Deadlift,80,5\n";
const fromPeakCsv = parseTrainingFile(new TextEncoder().encode(peakCsv), "peak.csv");
assert.equal(fromPeakCsv.achievements[0].peak.value, 120);
assert.equal(fromPeakCsv.achievements[0].peak.date, "2026-02-01");
assert.equal(fromPeakCsv.achievements[0].percentChange, 20);
const poundsCsv = "Date,Exercise,Weight (lb),Reps\n2026-01-01,Row,100,5\n2026-02-01,Row,110,5\n";
const fromPoundsCsv = parseTrainingFile(new TextEncoder().encode(poundsCsv), "pounds.csv");
assert.equal(Math.round(fromPoundsCsv.exercises[0].totalVolumeKg * 10) / 10, 476.3);
assert.equal(Math.round(fromPoundsCsv.exercises[0].progress[1].heaviestKg * 10) / 10, 49.9);
assert.throws(() => parseTrainingFile(new TextEncoder().encode("Date,Exercise,Weight (stone),Reps\n2026-01-01,Row,1,5"), "unsupported.csv"), /Unsupported weight unit/);
assert.throws(() => parseTrainingFile(new TextEncoder().encode("Date,Exercise,Weight (kg)\n2026-01-01,Row,10"), "missing.csv"), /Missing required CSV column/);
assert.equal(fromCsv.coverage.firstDate, "2026-01-01");
assert.ok(!JSON.stringify(fromCsv).includes("private-note-marker"));

const workbook = XLSX.utils.book_new();
for (const [name, values] of [
  ["Exercises - Total Sets", [2, 1]],
  ["Exercises - Total Reps", [10, 8]],
  ["Exercises - Heaviest Weight", [100, 80]],
  ["Exercises - Total Volume", [1000, 640]],
  ["Muscle Groups - Sets", [4, 2]],
]) {
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
    ["Date", name.startsWith("Muscle") ? "Chest" : "Bench Press"],
    [new Date("2026-01-01T00:00:00Z"), values[0]],
    [new Date("2026-02-01T00:00:00Z"), values[1]],
  ], { UTC: true }), name);
}
const fromXlsx = parseTrainingFile(new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true })), "training.xlsx");
assert.equal(fromXlsx.coverage.totalSessions, 2);
assert.equal(fromXlsx.exercises[0].totalVolumeKg, 1640);
assert.equal(fromXlsx.muscles[0].allTimeSets, 6);
assert.equal(fromXlsx.coverage.firstDate, "2026-01-01");
assert.throws(() => parseTrainingFile(new Uint8Array(), "bad.xlsx"), /archive/);
assert.throws(() => parseTrainingFile(new TextEncoder().encode(csv), "bad.exe"), /csv export/);
assert.throws(() => parseTrainingFile(new Uint8Array([0, 1]), "bad.csv"), /CSV/);
console.log("Local parser: CSV/XLSX totals, dates, muscle data, ignored notes, and invalid files passed");

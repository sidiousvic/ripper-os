import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as XLSX from "xlsx";
import { parseTrainingFile } from "../lib/training-parser.ts";
import { buildWorkbookFixtures } from "../tests/fixtures/macrofactor/build-workbooks.mjs";

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
assert.throws(() => parseTrainingFile(new TextEncoder().encode("Date,Exercise,Weight (kg),Reps\n1900-01-01,Row,10,5\n2026-01-01,Row,10,5"), "wide-history.csv"), /supported date span/);
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

// Fixture acceptance only; independently checked analytics baselines follow in V2-002.
const fixtureRoot = new URL("../tests/fixtures/macrofactor/", import.meta.url);
const generatedWorkbooks = buildWorkbookFixtures();
const repeatedWorkbooks = buildWorkbookFixtures();
for (const [name, bytes] of generatedWorkbooks) {
  assert.deepEqual(bytes, repeatedWorkbooks.get(name), `${name}: generation must be deterministic`);
  assert.deepEqual(bytes, await readFile(new URL(name, fixtureRoot)), `${name}: regenerate after changing the matrix`);
}
for (const name of ["six-months.csv", ...generatedWorkbooks.keys()]) {
  const data = parseTrainingFile(await readFile(new URL(name, fixtureRoot)), name);
  assert.equal(data.coverage.firstDate, "2026-01-05", name);
  assert.equal(data.coverage.lastDate, "2026-06-15", name);
  assert.equal(data.exercises.length, 6, name);
  assert.equal(data.monthly.length, 6, name);
  for (const alias of ["Wide Grip Pull-Up", "Bench Dip", "Jump Rope"]) {
    assert.ok(data.exercises.some((exercise) => exercise.name === alias), `${name}: ${alias}`);
  }
  if (name === "six-months.xlsx") {
    for (const metric of ["totalSets", "totalReps", "bestSetReps", "heaviestKg", "totalVolumeKg", "e1rmKg", "durationSec"]) {
      assert.ok(data.exercises.some((exercise) => exercise.availableMetrics.includes(metric)), `full fixture covers ${metric}`);
    }
    assert.ok(data.muscles.length > 0);
    assert.deepEqual(data.coverage, {
      firstDate: "2026-01-05", lastDate: "2026-06-15", journeyDays: 162,
      totalSessions: 24, averageSessionsPerMonth: 4, averageSessionsPerWeek: 1,
      exerciseCount: 6, longestActiveWeekStreak: 11,
    });
    assert.deepEqual(data.monthly.map(({ month, sessions, cumulative, coverage }) => ({ month, sessions, cumulative, coverage })), [
      { month: "2026-01", sessions: 5, cumulative: 5, coverage: "partial" },
      { month: "2026-02", sessions: 5, cumulative: 10, coverage: "complete" },
      { month: "2026-03", sessions: 0, cumulative: 10, coverage: "complete" },
      { month: "2026-04", sessions: 5, cumulative: 15, coverage: "complete" },
      { month: "2026-05", sessions: 5, cumulative: 20, coverage: "complete" },
      { month: "2026-06", sessions: 4, cumulative: 24, coverage: "partial" },
    ]);
    assert.deepEqual(data.gaps[0], { from: "2026-02-23", to: "2026-04-06", daysBetween: 42, daysOff: 41 });
    const bench = data.exercises.find((exercise) => exercise.name === "Barbell Bench Press");
    assert.deepEqual({ sessions: bench.sessions, totalSets: bench.totalSets, totalReps: bench.totalReps, totalVolumeKg: bench.totalVolumeKg }, { sessions: 24, totalSets: 72, totalReps: 552, totalVolumeKg: 38640 });
    assert.deepEqual(data.achievements.find((achievement) => achievement.exercise === "Barbell Bench Press"), {
      exercise: "Barbell Bench Press", metric: "heaviestKg", first: { date: "2026-01-05", value: 60 },
      latest: { date: "2026-06-15", value: 75 }, peak: { date: "2026-06-01", value: 85 }, percentChange: 42,
    });
    assert.deepEqual(data.muscles.find((muscle) => muscle.muscle === "Chest"), { muscle: "Chest", allTimeSets: 108, earlyWeekly: 5.6, recentWeekly: 5.6, change: 0 });
  } else {
    assert.equal(data.muscles.length, 0, `${name}: absent muscle data is not fabricated`);
  }
}
console.log("Synthetic six-month fixtures: reproducible workbooks, optional sheets, aliases and CSV acceptance passed");

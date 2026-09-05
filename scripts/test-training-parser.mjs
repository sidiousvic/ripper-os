import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as XLSX from "xlsx";
import { parseTrainingFile } from "../lib/training-parser.ts";
import { normalizeMacroFactor } from "../lib/import/adapters/macrofactor.ts";
import { inspectInput } from "../lib/import/inspect-input.ts";
import { buildDashboard } from "../lib/analytics/build-dashboard.ts";
import { validateCanonicalExerciseDays } from "../lib/import/validation.ts";
import { buildWorkbookFixtures } from "../tests/fixtures/macrofactor/build-workbooks.mjs";
const nullMetric = { totalSets: 0, totalReps: null, bestSetReps: null, heaviestKg: null, totalVolumeKg: null, e1rmKg: null, durationSec: null };
assert.equal(nullMetric.totalSets, 0);
assert.equal(nullMetric.totalReps, null);

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
const csvImport = normalizeMacroFactor(inspectInput(new TextEncoder().encode(csv), "training.csv"), "training.csv");
assert.equal(csvImport.schemaVersion, 1);
assert.equal(csvImport.source, "macrofactor");
assert.ok(csvImport.exerciseDays.length > 0);
assert.ok(csvImport.exerciseDays.every((day) => day.sourceRefs.length > 0 && day.origin === "source-aggregate"));
assert.deepEqual(validateCanonicalExerciseDays(csvImport.exerciseDays), []);

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

// V2-008: normalization precedes analytics; canonical facts are independently rebuildable.
const normalizeCsv = (text) => normalizeMacroFactor(inspectInput(new TextEncoder().encode(text), "sample.csv"), "sample.csv");
const withoutTime = (data) => { const copy = { ...data }; delete copy.generatedAt; return copy; };
assert.deepEqual(withoutTime(buildDashboard(csvImport, "csv")), withoutTime(fromCsv));
const changed = structuredClone(csvImport);
changed.exerciseDays[0].metrics.totalSets = 9;
assert.equal(buildDashboard(changed).exercises[0].totalSets, 10, "dashboard must read canonical facts");
assert.ok(!("dashboard" in csvImport));
assert.ok(csvImport.sourceRows.some(row => row.cells.includes("private-note-marker")));
assert.ok(!JSON.stringify(buildDashboard(csvImport)).includes("private-note-marker"));
assert.ok(csvImport.sourceRows.some(row => csvImport.exerciseDays[0].sourceRefs.includes(row.ref)));
const rawAlias = normalizeCsv("Date,Exercise,Weight (kg),Reps\n2026-01-01,Bench Dips,0,5\n");
assert.equal(rawAlias.exerciseDays[0].rawExerciseName, "Bench Dips");
assert.equal(rawAlias.exerciseDays[0].displayName, "Bench Dip");
const invalid = normalizeCsv("Date,Exercise,Weight (kg),Reps\n2026-02-30,Bench,100,5\n2026-02-01,Bench,100,-5\n2026-02-02,Bench,100,abc\n2026-02-03,Bench,,5\n2026-02-04,Bench,0,5\n");
assert.deepEqual(invalid.exerciseDays.map(day => day.date), ["2026-02-03", "2026-02-04"]);
assert.equal(invalid.exerciseDays[0].metrics.heaviestKg, null);
assert.equal(invalid.exerciseDays[0].metrics.totalVolumeKg, null);
assert.equal(invalid.exerciseDays[1].metrics.heaviestKg, 0);
assert.ok(invalid.issues.some(issue => issue.code === "invalid-date"));
assert.ok(invalid.issues.some(issue => issue.code === "invalid-reps"));
for (const patch of [{ date: "2026-02-30" }, { metrics: { ...csvImport.exerciseDays[0].metrics, totalSets: -1 } }]) {
  const malformed = structuredClone(csvImport);
  Object.assign(malformed.exerciseDays[0], patch);
  assert.throws(() => buildDashboard(malformed), /Invalid normalized/);
}
for (const [name, bytes] of generatedWorkbooks) {
  const imported = normalizeMacroFactor(inspectInput(bytes, name), name);
  assert.ok(!("sessions" in imported), "aggregate workbook must not invent sessions");
  assert.deepEqual(withoutTime(buildDashboard(imported, "workbook")), withoutTime(parseTrainingFile(bytes, name)));
  if (name === "six-months.xlsx") assert.ok(imported.muscleDays.length > 0);
  assert.ok(imported.sourceRows.every(row => row.sheet.startsWith("Exercises -") || row.sheet === "Muscle Groups - Sets"));
}
console.log("Canonical boundary: rebuild, provenance, muscle ledger, null/zero and invalid-input checks passed");

const { detectFormat } = await import("../lib/import/detect-format.ts");
const strongFixtureBytes = await readFile(new URL("../tests/fixtures/strong/original-export.csv", import.meta.url));
assert.equal(detectFormat(inspectInput(strongFixtureBytes, "renamed.csv")).format, "strong");
assert.equal(detectFormat(inspectInput(new TextEncoder().encode('\uFEFF' + csv), "renamed.xlsx")).format, "macrofactor");
assert.equal(detectFormat(inspectInput(generatedWorkbooks.get("six-months.xlsx"), "renamed.csv")).format, "macrofactor");
assert.equal(parseTrainingFile(generatedWorkbooks.get("six-months.xlsx"), "renamed.csv").coverage.totalSessions, 24);
const inspectCsv = (text) => inspectInput(new TextEncoder().encode(text), "detect.csv");
assert.equal(detectFormat(inspectCsv("foo,bar\nx,y")).format, "unknown");
assert.deepEqual(detectFormat(inspectCsv("Date,Exercise,Reps,Workout Name,Duration,Exercise Name,Set Order,Weight\n")), {format:"ambiguous", candidates:["macrofactor","strong"]});
assert.throws(() => inspectInput(new Uint8Array([80,75,0,0]), "zip.csv"), /archive/);
console.log("Detection: source signatures, BOM, renamed files, unknown and ambiguous input passed");

const { parseStrongRows } = await import("../lib/import/adapters/strong-rows.ts");
const { parseImport } = await import('../lib/import/parse-import.ts');
const strongInput = inspectInput(strongFixtureBytes, "strong.csv");
assert.equal(parseImport(strongFixtureBytes, "strong.csv").status, "needs-input");
const parsedStrong = parseImport(strongFixtureBytes, "strong.csv", { weightUnit: "kg", distanceUnit: "km" });
assert.equal(parsedStrong.status, "ready");
assert.equal(parsedStrong.source, "strong");
assert.equal(parsedStrong.dashboard.coverage.totalSessions, 86);
const stagedStrong = parseStrongRows(strongInput);
assert.equal(stagedStrong.rows.length, 1903);
assert.deepEqual(stagedStrong.needs, ["weight-unit", "distance-unit"]);
assert.equal(stagedStrong.rows[0].localTimestamp, "2020-12-30 18:51:52");
assert.equal(stagedStrong.rows[0].ref, "Sheet1!2");
const strongHeader = 'Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n';
const stagedSynthetic = parseStrongRows(inspectCsv(strongHeader + [
 '2026-01-02 12:30:00,Test,1h 20m,Bench,1,,5,0,0,"line 1\nline 2",,8',
 '2026-01-02 12:30:00,Test,1h 20m,Bench,2,0,5,0,0,,,',
 '2026-02-30 12:30:00,Test,1h,Bench,1,100,5,0,0,,,',
 '2026-01-02 12:30:00,Test,1h,Bench,3,100,-1,0,0,,,',
 '01/02/2026 12:30:00,Test,1h,Bench,4,100,5,0,0,,,',
 '2026-01-02 12:30:00,Test,1h,,5,100,5,0,0,,,',
 '2026-01-02 12:30:00,Test,1h,Bench,6,Infinity,NaN,0,0,,,',
].join('\n')));
assert.equal(stagedSynthetic.rows.length, 2);
assert.equal(stagedSynthetic.rows[0].weight, null);
assert.equal(stagedSynthetic.rows[1].weight, 0);
assert.equal(stagedSynthetic.rows[0].notes, 'line 1\nline 2');
assert.equal(stagedSynthetic.sourceRows[1].row, 3, "row numbers count CSV records, not quoted physical lines");
assert.ok(stagedSynthetic.needs.includes('date-format'));
assert.equal(parseStrongRows(strongInput, {weightUnit:'kg', distanceUnit:'km'}).status, 'ready');
console.log('Strong rows: real fixture, explicit options, notes, zero/blank and malformed data passed');

const { groupStrongSessions } = await import('../lib/import/adapters/strong-sessions.ts');
const groupedStrong = groupStrongSessions(stagedStrong, 'strong:test');
assert.equal(groupedStrong.sessions.length, 86);
assert.equal(groupedStrong.sessions.flatMap(session => session.exercises.flatMap(exercise => exercise.rows)).length, 1903);
assert.equal(groupedStrong.ambiguousRowRefs.length, 0);
assert.deepEqual(groupStrongSessions(stagedStrong, 'strong:test'), groupedStrong, 'group IDs deterministic within an import');
const sequenceRows = ['Bench','Row','Bench'].flatMap((name) => [1,2].map(order => `2026-01-02 09:00:00,Morning,1h,${name},${order},80,8,0,0,,,`));
sequenceRows.push('2026-01-02 18:00:00,Evening,1h,Bench,1,80,8,0,0,,,');
sequenceRows.push(sequenceRows.at(-1));
const sequence = groupStrongSessions(parseStrongRows(inspectCsv(strongHeader + sequenceRows.join('\n'))), 'strong:sequence');
assert.equal(sequence.sessions.length, 2);
assert.deepEqual(sequence.sessions[0].exercises.map(exercise=>exercise.rawExerciseName), ['Bench','Row','Bench']);
assert.equal(sequence.sessions[1].exercises[0].rows.length, 2, 'identical sets stay separate');
const reset = groupStrongSessions(parseStrongRows(inspectCsv(strongHeader + [2,1].map(order=>`2026-01-02 09:00:00,Morning,1h,Bench,${order},80,8,0,0,,,`).join('\n'))), 'strong:reset');
assert.equal(reset.sessions[0].exercises.length, 2);
assert.ok(reset.issues.some(issue=>issue.code === 'ambiguous-set-reset'));
const missingBoundary = groupStrongSessions(parseStrongRows(inspectCsv(strongHeader + '2026-01-02 09:00:00,,1h,Bench,1,80,8,0,0,,,')), 'strong:missing');
assert.equal(missingBoundary.sessions.length, 0);
assert.equal(missingBoundary.ambiguousRowRefs.length, 1);
console.log('Strong grouping: 86 sessions, all sets, two-a-day, repeated blocks and ambiguity passed');

const { normalizeStrong } = await import('../lib/import/adapters/strong.ts');
const { projectStrengthImport } = await import('../lib/analytics/project-strength.ts');
const { kilograms, meters } = await import('../lib/import/units.ts');
const { assertValidDetailedImport } = await import('../lib/import/validation.ts');
assert.ok(Math.abs(kilograms(100, 'lb') - 45.359237) < 1e-10);
assert.ok(Math.abs(kilograms(100, 'lb') / 0.45359237 - 100) < 1e-10);
assert.equal(meters(1, 'mi'), 1609.344);
assert.equal(meters(1.5, 'km'), 1500);
assert.throws(()=>kilograms(100, 'stone'), /unit/);
assert.equal(normalizeStrong(strongInput, 'strong.csv').status, 'needs-input');
const normalizedStrong = normalizeStrong(strongInput, 'strong.csv', {weightUnit:'kg', distanceUnit:'km'});
assert.equal(normalizedStrong.status, 'ready');
assert.equal(normalizedStrong.data.sessions.length, 86);
assert.equal(normalizedStrong.data.sourceRows.length, 1903);
assert.equal(normalizedStrong.data.sessions[0].durationSeconds, 9480);
assert.equal(normalizedStrong.data.sessions[0].exercises[0].sets[0].durationSeconds, 0);
assert.equal(normalizedStrong.data.sessions[0].exercises[0].sets[0].load.component, 'unknown');
assert.equal(normalizedStrong.data.sessions[0].startedAt, undefined);
assert.equal(normalizedStrong.data.sessions[0].exercises[0].sets[0].completed, null);
assertValidDetailedImport(normalizedStrong.data);
const projectedStrong = projectStrengthImport(normalizedStrong.data);
assert.equal(projectedStrong.exerciseDays.every(day => day.origin === 'derived-from-sets'), true);
assert.equal(projectedStrong.exerciseDays.length, 320);
assert.equal(projectedStrong.exerciseDays[0].metrics.totalSets, 8);
assert.equal(projectedStrong.exerciseDays[0].metrics.totalReps, 26);
assert.equal(projectedStrong.exerciseDays[0].metrics.heaviestKg, null, 'unknown load basis stays non-comparable');
assert.equal(projectedStrong.exerciseDays[0].metrics.totalVolumeKg, null, 'unknown load basis has no tonnage');
assert.equal(buildDashboard(normalizedStrong.data).coverage.totalSessions, 86);
const projectedMissing = projectStrengthImport({ ...normalizedStrong.data, sessions: [{ ...normalizedStrong.data.sessions[0], exercises: [{ ...normalizedStrong.data.sessions[0].exercises[0], sets: [{ ...normalizedStrong.data.sessions[0].exercises[0].sets[0], reps: null, load: null }] }] }] });
assert.equal(projectedMissing.exerciseDays[0].metrics.totalReps, null, 'missing reps do not become zero');
const measurementCsv = inspectCsv(strongHeader + [
 '2026-01-02 12:30:00,Test,1h,Pull-Up,1,100,5,0,0,,,',
 '2026-01-02 12:30:00,Test,1h,Pull-Up,2,0,5,0,0,,,',
 '2026-01-02 12:30:00,Test,1h,Pull-Up,3,,5,0,0,,,',
 '2026-01-02 12:30:00,Test,1h,Plank,1,,,0,60,,,',
 '2026-01-02 12:30:00,Test,1h,Walk,1,,,2,0,,,',
].join('\n'));
const measurements = normalizeStrong(measurementCsv, 'measurements.csv', {weightUnit:'lb', distanceUnit:'km', loadSemantics:{'Pull-Up':{component:'assistance',basis:'machine-setting'}}});
assert.equal(measurements.status, 'ready');
const measuredExercises = measurements.data.sessions[0].exercises;
assert.ok(Math.abs(measuredExercises[0].sets[0].load.kg - 45.359237)<1e-10);
assert.equal(measuredExercises[0].sets[0].load.component,'assistance');
assert.equal(measuredExercises[0].sets[0].load.originalValue,100);
assert.equal(measuredExercises[0].sets[1].load.kg,0);
assert.equal(measuredExercises[0].sets[2].load,null);
assert.equal(measuredExercises[1].sets[0].reps,null);
assert.equal(measuredExercises[1].sets[0].durationSeconds,60);
assert.equal(measuredExercises[2].sets[0].distanceMeters,2000);
const conflictInput = inspectCsv(strongHeader.trimEnd() + ',Weight Unit\n2026-01-02 12:30:00,Test,1h,Bench,1,100,5,0,0,,,,lb');
assert.ok(normalizeStrong(conflictInput,'mixed.csv',{weightUnit:'kg'}).needs.includes('row-unit-conventions'));
const corrupt = structuredClone(normalizedStrong.data);
corrupt.sessions[0].exercises[0].sets[0].load.kg = Infinity;
assert.throws(()=>assertValidDetailedImport(corrupt), /Invalid normalized/);
console.log('Strong canonical units: fixture, lb/kg, zero/missing, timed/distance, assistance and conflicts passed');

const collidingAliasesCsv = 'Date,Exercise,Weight (kg),Reps\n2026-01-02,Bench Dips,0,5\n2026-01-02,Bench Dip,0,8\n';
const collidingAliasesImport = normalizeCsv(collidingAliasesCsv);
assert.equal(collidingAliasesImport.exerciseDays.length, 2, 'raw alias facts remain distinct');
const aliasView = buildDashboard(collidingAliasesImport, 'csv');
assert.equal(aliasView.exercises.length, 1);
assert.equal(aliasView.exercises[0].totalSets, 2);
assert.equal(aliasView.exercises[0].totalReps, 13);
assert.equal(aliasView.exercises[0].progress[0].bestSetReps, 8);
const aliasWorkbook = XLSX.utils.book_new();
for (const [sheet, a, b] of [['Exercises - Total Sets',2,null], ['Exercises - Total Reps',null,13]]) {
  XLSX.utils.book_append_sheet(aliasWorkbook, XLSX.utils.aoa_to_sheet([['Date','Bench Dips','Bench Dip'],['2026-01-02',a,b]]),sheet);
}
const aliasWorkbookBytes = new Uint8Array(XLSX.write(aliasWorkbook,{type:'array',bookType:'xlsx',compression:true}));
const workbookAliasView = parseTrainingFile(aliasWorkbookBytes,'aliases.xlsx');
assert.equal(workbookAliasView.exercises[0].totalSets,2);
assert.equal(workbookAliasView.exercises[0].totalReps,13);
console.log('Legacy alias collisions: canonical names retained and CSV/workbook presentation parity passed');

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseImport } from '../lib/import/parse-import.ts';
import { combineImports } from '../lib/history/combine-imports.ts';
import { sessionFingerprint } from '../lib/history/fingerprints.ts';
import { buildDashboard } from '../lib/analytics/build-dashboard.ts';
import { projectStrengthImport } from '../lib/analytics/project-strength.ts';

const options = { weightUnit: 'kg', distanceUnit: 'km' };
const bytes = await readFile(new URL('../tests/fixtures/strong/original-export.csv', import.meta.url));
const strong = parseImport(bytes, 'original.csv', options).importData;
const take = (sessions) => ({ ...strong, sessions });
const firstHalf = take(strong.sessions.slice(0, 40));
const start = combineImports([], firstHalf);
assert.equal(start.ok, true);
const original = JSON.stringify(start.imports);
const march = combineImports(start.imports, strong);
assert.equal(march.ok, true);
assert.equal(march.added, 46);
assert.equal(march.unchanged, 40);
assert.equal(JSON.stringify(start.imports), original);
const summary = (imports) => { const result = buildDashboard(imports); delete result.generatedAt; return result; };
assert.deepEqual(summary(march.imports), summary([strong]));
const reversed = combineImports(march.imports, take([...strong.sessions].reverse()));
assert.equal(reversed.status, 'unchanged');
assert.deepEqual(summary(reversed.imports), summary(march.imports));
const freshExport = parseImport(bytes, 'renamed.csv', options).importData;
assert.notEqual(freshExport.importId, strong.importId);
assert.equal(combineImports(march.imports, freshExport).status, 'unchanged', 'generated IDs and filenames are not identity');
const missing = combineImports(march.imports, firstHalf);
assert.equal(missing.status, 'unchanged');
assert.deepEqual(summary(missing.imports), summary(march.imports));

const alias = structuredClone(firstHalf);
for (const session of alias.sessions) {
  session.id += ':another-import';
  for (const exercise of session.exercises) {
    exercise.exerciseId = 'user_override'; exercise.displayName = 'User label'; exercise.comparisonKey = 'user-series';
  }
}
assert.equal(combineImports(start.imports, alias).status, 'unchanged');
const edited = structuredClone(strong);
edited.sessions[0].exercises[0].sets[0].reps += 1;
assert.equal(combineImports(start.imports, edited).conflict.kind, 'changed');
assert.equal(JSON.stringify(start.imports), original, 'conflict must roll back all additions');
const changedUnit = structuredClone(firstHalf.sessions[0]);
changedUnit.exercises[0].sets[0].load.basis = 'per-side';
assert.notEqual(sessionFingerprint(changedUnit).payload, sessionFingerprint(firstHalf.sessions[0]).payload);
assert.throws(() => combineImports(start.imports, take([firstHalf.sessions[0], firstHalf.sessions[0]])), /Invalid normalized/);
const dateOnly = { ...firstHalf.sessions[0], timePrecision: 'date', originalStartedAt: undefined };
assert.equal(combineImports(start.imports, take([dateOnly])).conflict.kind, 'ambiguous');
const sourceId = { ...dateOnly, boundary: 'source-id', sourceSessionId: 'verified-id' };
assert.ok(sessionFingerprint(sourceId));

// A second verified workout on the same date is new; all repeated sets survive.
const am = firstHalf.sessions[0];
const pm = structuredClone(am);
pm.id += ':pm'; pm.originalStartedAt = `${pm.date} 23:59:00`;
pm.exercises.forEach(exercise => { exercise.id += ':pm'; exercise.sets.forEach(set => { set.id += ':pm'; }); });
const morning = combineImports([], take([am]));
const duplicateLocator = { ...pm, originalStartedAt: am.originalStartedAt };
assert.equal(combineImports([], take([am, duplicateLocator])).conflict.kind, 'ambiguous');
const evening = combineImports(morning.imports, take([am, pm]));
assert.equal(evening.added, 1);
const twoADay = buildDashboard(evening.imports);
assert.equal(twoADay.coverage.totalSessions, 1);
assert.equal(twoADay.coverage.knownWorkouts, 2);
assert.deepEqual(summary(evening.imports), summary([take([am, pm])]));

const mf = (rows) => parseImport(new TextEncoder().encode('Date,Exercise,Weight (kg),Reps\n' + rows), 'mf.csv').importData;
const jan = mf('2026-01-01,Barbell Bench Press,80,8\n');
const all = mf('2026-01-01,Barbell Bench Press,80,8\n2026-03-01,Barbell Bench Press,85,8\n');
const mfStart = combineImports([], jan);
const mfAdded = combineImports(mfStart.imports, all);
assert.equal(mfAdded.ok, true);
assert.deepEqual(summary(mfAdded.imports), summary([all]));
assert.equal(combineImports(mfAdded.imports, jan).status, 'unchanged');
assert.equal(combineImports(mfStart.imports, mf('2026-01-01,Barbell Bench Press,80,9\n')).conflict.kind, 'changed');
const moreMetrics = structuredClone(jan);
moreMetrics.exerciseDays[0].metrics.e1rmKg = 100;
const extra = combineImports(mfStart.imports, moreMetrics);
assert.equal(extra.added, 1);
assert.deepEqual(summary(extra.imports), summary([moreMetrics]));
const renamed = structuredClone(moreMetrics);
renamed.exerciseDays[0].exerciseId = 'override'; renamed.exerciseDays[0].displayName = 'Custom label';
assert.equal(combineImports(extra.imports, renamed).status, 'unchanged');
const missingMetric = structuredClone(jan);
missingMetric.exerciseDays[0].metrics.totalReps = null;
assert.deepEqual(summary(combineImports(extra.imports, missingMetric).imports), summary(extra.imports));
const zero = structuredClone(missingMetric);
zero.exerciseDays[0].metrics.totalReps = 0;
assert.equal(combineImports(extra.imports, zero).conflict.kind, 'changed', 'zero is not missing');

const muscle = { importId: jan.importId, source: jan.source, date: '2026-01-01', rawMuscleName: 'Chest', setEquivalents: 2 };
const withMuscle = { ...jan, muscleDays: [muscle] };
const muscleStart = combineImports([], withMuscle);
assert.equal(combineImports(muscleStart.imports, withMuscle).status, 'unchanged');
assert.equal(combineImports(muscleStart.imports, { ...withMuscle, muscleDays: [{ ...muscle, setEquivalents: 3 }] }).conflict.kind, 'changed');
const workbook = parseImport(await readFile(new URL('../tests/fixtures/macrofactor/six-months.xlsx', import.meta.url)), 'mf.xlsx').importData;
const workbookStart = combineImports([], workbook);
assert.equal(combineImports(workbookStart.imports, workbook).status, 'unchanged');
assert.deepEqual(summary(combineImports(workbookStart.imports, workbook).imports), summary(workbookStart.imports));

// A daily projection cannot establish session identity, in either import order.
const projected = projectStrengthImport(firstHalf);
assert.equal(combineImports(start.imports, projected).conflict.kind, 'ambiguous');
assert.equal(combineImports([projected], firstHalf).conflict.kind, 'ambiguous');
const foreign = { ...jan, source: 'hevy', exerciseDays: jan.exerciseDays.map(day => ({ ...day, source: 'hevy' })) };
assert.equal(combineImports(mfStart.imports, foreign).conflict.kind, 'overlap');
console.log('Reconciliation: real Strong superset, reordered/missing/edited workouts, aliases, two-a-day, aggregate metrics, muscles and ambiguous projections passed');
